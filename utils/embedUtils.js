const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

/**
 * Utility class for Discord embed operations
 */
class EmbedUtils {
    /**
     * Split long text into chunks respecting Discord limits
     * @param {string} text - Text to split
     * @param {number} maxLength - Maximum length per chunk
     * @returns {string[]} Array of text chunks
     */
    static splitLongText(text, maxLength = config.maxEmbedLength) {
        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a non-empty string');
        }

        if (text.length <= maxLength) return [text];

        const chunks = [];
        let currentChunk = '';

        // Try to split by sentences first
        const sentences = text.split(/[.!?]+\s+/);

        for (const sentence of sentences) {
            const sentenceWithPunctuation = sentence + '. ';

            if ((currentChunk + sentenceWithPunctuation).length > maxLength) {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }

                // If single sentence is too long, split by words
                if (sentenceWithPunctuation.length > maxLength) {
                    const words = sentence.split(' ');
                    for (const word of words) {
                        if ((currentChunk + word + ' ').length > maxLength) {
                            if (currentChunk.trim()) {
                                chunks.push(currentChunk.trim());
                            }
                            currentChunk = word + ' ';
                        } else {
                            currentChunk += word + ' ';
                        }
                    }
                } else {
                    currentChunk = sentenceWithPunctuation;
                }
            } else {
                currentChunk += sentenceWithPunctuation;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text.substring(0, maxLength)];
    }

    /**
     * Check if bot has required permissions in channel
     * @param {TextChannel} channel - Discord channel
     * @param {GuildMember} botMember - Bot's guild member
     * @returns {Object} Permission check result
     */
    static checkPermissions(channel, botMember = null) {
        if (!channel.guild) {
            return { hasPermissions: true, missingPermissions: [] };
        }

        const member = botMember || channel.guild.members.me;
        const permissions = channel.permissionsFor(member);

        const requiredPerms = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ];

        const missingPermissions = [];

        for (const perm of requiredPerms) {
            if (!permissions.has(perm)) {
                missingPermissions.push(perm);
            }
        }

        return {
            hasPermissions: missingPermissions.length === 0,
            missingPermissions
        };
    }

    /**
     * Send long embed with automatic chunking
     * @param {TextChannel} channel - Target channel
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Object} options - Additional options
     * @returns {Promise<number>} Number of embeds sent
     */
    static async sendLongEmbed(channel, title, description, options = {}) {
        if (!channel || !title || !description) {
            throw new Error('Channel, title, and description are required');
        }

        // Check permissions
        const permCheck = this.checkPermissions(channel);
        if (!permCheck.hasPermissions) {
            throw new Error(`Missing permissions: ${permCheck.missingPermissions.join(', ')}`);
        }

        const chunks = this.splitLongText(description);
        const embeds = [];

        for (let i = 0; i < chunks.length; i++) {
            const embed = new EmbedBuilder()
                .setColor(options.color || config.embedColor)
                .setDescription(chunks[i]);

            // Add title only to first embed
            if (i === 0) {
                embed.setTitle(title);
                if (options.thumbnail) embed.setThumbnail(options.thumbnail);
                if (options.author) embed.setAuthor(options.author);
                if (options.image) embed.setImage(options.image);
            }

            // Add page footer for multiple embeds
            if (chunks.length > 1) {
                embed.setFooter({
                    text: `Halaman ${i + 1} dari ${chunks.length}${options.footer ? ` • ${options.footer.text}` : ''}`,
                    iconURL: options.footer?.iconURL
                });
            } else if (options.footer) {
                embed.setFooter(options.footer);
            }

            // Add timestamp to last embed
            if (i === chunks.length - 1 && options.timestamp) {
                embed.setTimestamp();
            }

            embeds.push(embed);
        }

        // Send embeds with retry logic
        let sentCount = 0;
        for (const embed of embeds) {
            let retries = 0;
            while (retries < config.maxRetries) {
                try {
                    await channel.send({ embeds: [embed] });
                    sentCount++;
                    break;
                } catch (error) {
                    retries++;
                    if (retries >= config.maxRetries) {
                        throw error;
                    }
                    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
                }
            }

            // Small delay between embeds to avoid rate limits
            if (sentCount < embeds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return sentCount;
    }

    /**
     * Create embed with fields and automatic pagination
     * @param {string} title - Embed title
     * @param {Array} fields - Array of field objects
     * @param {Object} options - Additional options
     * @returns {EmbedBuilder[]} Array of embeds
     */
    static createFieldEmbed(title, fields, options = {}) {
        if (!title || !Array.isArray(fields)) {
            throw new Error('Title and fields array are required');
        }

        const embeds = [];
        const chunkedFields = [];

        // Validate and chunk fields
        const validFields = fields.filter(field =>
            field && field.name && field.value &&
            field.name.length <= 256 && field.value.length <= config.maxFieldLength
        );

        for (let i = 0; i < validFields.length; i += config.maxFields) {
            chunkedFields.push(validFields.slice(i, i + config.maxFields));
        }

        chunkedFields.forEach((fieldChunk, index) => {
            const embed = new EmbedBuilder()
                .setColor(options.color || config.embedColor);

            if (index === 0) {
                embed.setTitle(title);
                if (options.description) {
                    const truncatedDesc = options.description.length > config.maxEmbedLength
                        ? options.description.substring(0, config.maxEmbedLength - 3) + '...'
                        : options.description;
                    embed.setDescription(truncatedDesc);
                }
                if (options.thumbnail) embed.setThumbnail(options.thumbnail);
                if (options.author) embed.setAuthor(options.author);
            }

            // Add fields with validation
            fieldChunk.forEach(field => {
                embed.addFields({
                    name: field.name.substring(0, 256),
                    value: field.value.substring(0, config.maxFieldLength),
                    inline: Boolean(field.inline)
                });
            });

            // Add pagination footer
            if (chunkedFields.length > 1) {
                embed.setFooter({
                    text: `Halaman ${index + 1} dari ${chunkedFields.length}${options.footer ? ` • ${options.footer.text}` : ''}`,
                    iconURL: options.footer?.iconURL
                });
            } else if (options.footer) {
                embed.setFooter(options.footer);
            }

            if (index === chunkedFields.length - 1 && options.timestamp) {
                embed.setTimestamp();
            }

            embeds.push(embed);
        });

        return embeds;
    }
}

module.exports = EmbedUtils;
