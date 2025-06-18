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
     * Check if bot has required permissions in channel with detailed analysis
     * @param {TextChannel} channel - Discord channel
     * @param {GuildMember} botMember - Bot's guild member
     * @returns {Object} Detailed permission check result
     */
    static checkPermissions(channel, botMember = null) {
        if (!channel.guild) {
            return { hasPermissions: true, missingPermissions: [], details: 'DM Channel' };
        }

        const member = botMember || channel.guild.members.me;

        // Check if bot is in the guild
        if (!member) {
            return {
                hasPermissions: false,
                missingPermissions: ['Bot not in guild'],
                details: 'Bot is not a member of this guild'
            };
        }

        const permissions = channel.permissionsFor(member);

        // Check if bot can access the channel at all
        if (!permissions) {
            return {
                hasPermissions: false,
                missingPermissions: ['No channel access'],
                details: 'Bot cannot access this channel'
            };
        }

        const requiredPerms = [
            { name: 'View Channel', flag: PermissionFlagsBits.ViewChannel },
            { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
            { name: 'Embed Links', flag: PermissionFlagsBits.EmbedLinks }
        ];

        const missingPermissions = [];
        const hasPermissions = [];

        for (const perm of requiredPerms) {
            if (!permissions.has(perm.flag)) {
                missingPermissions.push(perm.name);
            } else {
                hasPermissions.push(perm.name);
            }
        }

        return {
            hasPermissions: missingPermissions.length === 0,
            missingPermissions,
            hasPermissions: hasPermissions,
            details: `${hasPermissions.length}/${requiredPerms.length} permissions available`
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

    /**
     * Create a quick embed with common patterns
     * @param {string} type - success, error, warning, info
     * @param {string} title - Embed title
     * @param {string} description - Embed description
     * @param {Object} options - Additional options
     * @returns {EmbedBuilder} Configured embed
     */
    static createQuickEmbed(type, title, description, options = {}) {
        const colors = {
            success: config.successColor || '#00ff00',
            error: config.errorColor || '#ff0000',
            warning: config.warningColor || '#ffaa00',
            info: config.embedColor || '#0099ff'
        };

        const emojis = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const embed = new EmbedBuilder()
            .setTitle(`${emojis[type] || ''} ${title}`)
            .setDescription(description)
            .setColor(colors[type] || colors.info);

        if (options.timestamp) embed.setTimestamp();
        if (options.footer) embed.setFooter(options.footer);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.fields) {
            options.fields.forEach(field => embed.addFields(field));
        }

        return embed;
    }

    /**
     * Send temporary message that auto-deletes
     * @param {TextChannel} channel - Target channel
     * @param {string|EmbedBuilder} content - Message content or embed
     * @param {number} deleteAfter - Time in milliseconds before deletion
     * @returns {Promise<Message>} Sent message
     */
    static async sendTemporaryMessage(channel, content, deleteAfter = 10000) {
        const messageOptions = typeof content === 'string'
            ? { content }
            : { embeds: [content] };

        const message = await channel.send(messageOptions);

        setTimeout(() => {
            message.delete().catch(() => { });
        }, deleteAfter);

        return message;
    }

    /**
     * Validate embed before sending
     * @param {EmbedBuilder} embed - Embed to validate
     * @returns {Object} Validation result
     */
    static validateEmbed(embed) {
        const data = embed.toJSON();
        const errors = [];

        if (data.title && data.title.length > 256) {
            errors.push('Title exceeds 256 characters');
        }

        if (data.description && data.description.length > 4096) {
            errors.push('Description exceeds 4096 characters');
        }

        if (data.fields) {
            if (data.fields.length > 25) {
                errors.push('Too many fields (max 25)');
            }

            data.fields.forEach((field, index) => {
                if (field.name && field.name.length > 256) {
                    errors.push(`Field ${index + 1} name exceeds 256 characters`);
                }
                if (field.value && field.value.length > 1024) {
                    errors.push(`Field ${index + 1} value exceeds 1024 characters`);
                }
            });
        }

        if (data.footer && data.footer.text && data.footer.text.length > 2048) {
            errors.push('Footer exceeds 2048 characters');
        }

        const totalLength = (data.title?.length || 0) +
            (data.description?.length || 0) +
            (data.fields?.reduce((sum, field) => sum + (field.name?.length || 0) + (field.value?.length || 0), 0) || 0) +
            (data.footer?.text?.length || 0);

        if (totalLength > 6000) {
            errors.push('Total embed length exceeds 6000 characters');
        }

        return {
            valid: errors.length === 0,
            errors,
            totalLength
        };
    }
}

module.exports = EmbedUtils;
