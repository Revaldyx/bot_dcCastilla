const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

const stickyDataPath = path.join(__dirname, '..', 'data', 'sticky.json');

class StickyManager {
    static loadStickyData() {
        try {
            if (fs.existsSync(stickyDataPath)) {
                return JSON.parse(fs.readFileSync(stickyDataPath, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading sticky data:', error);
        }
        return {};
    }

    static saveStickyData(data) {
        try {
            const dataDir = path.dirname(stickyDataPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(stickyDataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving sticky data:', error);
        }
    }

    /**
     * Check if a message ID is a sticky message
     * @param {string} messageId - Message ID to check
     * @returns {Object|null} Sticky data if found, null otherwise
     */
    static findStickyByMessageId(messageId) {
        const stickyData = this.loadStickyData();
        for (const channelId in stickyData) {
            if (stickyData[channelId].messageId === messageId) {
                return { channelId, ...stickyData[channelId] };
            }
        }
        return null;
    }

    /**
     * Check if a message ID is a sticky message
     * @param {string} messageId - Message ID to check
     * @returns {boolean} True if message is sticky
     */
    static isStickyMessage(messageId) {
        return this.findStickyByMessageId(messageId) !== null;
    }

    /**
     * Get all sticky message IDs
     * @returns {string[]} Array of sticky message IDs
     */
    static getAllStickyMessageIds() {
        const stickyData = this.loadStickyData();
        const stickyIds = [];
        for (const channelId in stickyData) {
            if (stickyData[channelId].messageId) {
                stickyIds.push(stickyData[channelId].messageId);
            }
        }
        return stickyIds;
    }

    /**
     * Get sticky data for a specific channel
     * @param {string} channelId - Channel ID
     * @returns {Object|null} Sticky data or null
     */
    static getStickyForChannel(channelId) {
        const stickyData = this.loadStickyData();
        return stickyData[channelId] || null;
    }

    /**
     * Create sticky message content
     * @param {Object} sticky - Sticky data
     * @returns {Object} Message content object
     */
    static createStickyContent(sticky) {
        if (sticky.isPlainText) {
            let messageOptions = { content: sticky.content };

            // Add image as embed for plain text sticky
            if (sticky.imageUrl) {
                const imageEmbed = new EmbedBuilder()
                    .setImage(sticky.imageUrl)
                    .setColor(config.embedColor);
                messageOptions.embeds = [imageEmbed];
            }

            return messageOptions;
        } else {
            const stickyEmbed = new EmbedBuilder()
                .setTitle('📌 Sticky Message')
                .setDescription(sticky.content)
                .setColor(config.embedColor)
                .setFooter({ text: 'Pesan ini akan selalu muncul di atas' })
                .setTimestamp();

            // Add image to embed if provided
            if (sticky.imageUrl) {
                stickyEmbed.setImage(sticky.imageUrl);
            }

            return { embeds: [stickyEmbed] };
        }
    }

    /**
     * Handle sticky message deletion and auto-recreation
     * @param {Message} deletedMessage - The deleted message
     * @param {Client} client - Discord client
     */
    static async handleStickyDeletion(deletedMessage, client) {
        if (!config.protectStickyMessages) return;

        const messageId = deletedMessage.id;
        const stickyInfo = this.findStickyByMessageId(messageId);

        if (stickyInfo) {
            console.log(`🛡️ Sticky message deleted, recreating in channel ${stickyInfo.channelId}: ${messageId}`);

            try {
                const channel = await client.channels.fetch(stickyInfo.channelId);
                if (!channel) {
                    console.warn(`Channel ${stickyInfo.channelId} not found for sticky recreation`);
                    return;
                }

                // Small delay to avoid conflicts
                await new Promise(resolve => setTimeout(resolve, 500));

                // Recreate the sticky message
                const messageContent = this.createStickyContent(stickyInfo);
                const newStickyMessage = await channel.send(messageContent);

                // Update the sticky data with new message ID
                const stickyData = this.loadStickyData();
                if (stickyData[stickyInfo.channelId]) {
                    stickyData[stickyInfo.channelId].messageId = newStickyMessage.id;
                    stickyData[stickyInfo.channelId].lastRecreated = Date.now();
                    this.saveStickyData(stickyData);

                    console.log(`✅ Sticky message recreated with new ID: ${newStickyMessage.id}`);

                    // Send temporary warning message
                    if (config.stickyProtectionWarning) {
                        const warningMsg = await channel.send(config.stickyProtectionWarning);
                        setTimeout(async () => {
                            try {
                                await warningMsg.delete();
                            } catch (error) {
                                // Warning message might already be deleted
                            }
                        }, 5000);
                    }
                }

            } catch (error) {
                console.error('Error recreating sticky message:', error);

                // If recreation fails, try again after a longer delay
                setTimeout(async () => {
                    try {
                        await this.handleStickyDeletion(deletedMessage, client);
                    } catch (retryError) {
                        console.error('Failed to recreate sticky message on retry:', retryError);
                    }
                }, 3000);
            }
        }
    }

    /**
     * Handle bulk sticky message deletion
     * @param {Collection} deletedMessages - Collection of deleted messages
     * @param {Client} client - Discord client
     */
    static async handleBulkStickyDeletion(deletedMessages, client) {
        if (!config.protectStickyMessages) return;

        const stickyMessagesToRecreate = [];

        // Find all sticky messages in the deleted batch
        for (const [messageId, deletedMessage] of deletedMessages) {
            const stickyInfo = this.findStickyByMessageId(messageId);
            if (stickyInfo) {
                stickyMessagesToRecreate.push({ deletedMessage, stickyInfo });
            }
        }

        // Recreate sticky messages with delays to avoid rate limits
        for (let i = 0; i < stickyMessagesToRecreate.length; i++) {
            const { deletedMessage, stickyInfo } = stickyMessagesToRecreate[i];

            try {
                // Add delay between recreations
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                await this.handleStickyDeletion(deletedMessage, client);
            } catch (error) {
                console.error(`Error recreating sticky message ${i + 1}:`, error);
            }
        }
    }

    static async handleStickyMessage(message) {
        // Don't process bot messages or messages that start with command prefix
        if (message.author.bot || message.content.startsWith(config.prefix)) {
            return;
        }

        const channelId = message.channel.id;
        const stickyData = this.loadStickyData();

        if (!stickyData[channelId]) {
            return;
        }

        const sticky = stickyData[channelId];

        console.log('Processing sticky message, type:', sticky.isPlainText ? 'Text' : 'Embed');

        try {
            // Try to delete the old sticky message
            try {
                const oldStickyMessage = await message.channel.messages.fetch(sticky.messageId);
                await oldStickyMessage.delete();
            } catch (fetchError) {
                // Old sticky message might already be deleted
                console.log('Old sticky message not found, creating new one');
            }

            // Create new sticky message
            const messageContent = this.createStickyContent(sticky);
            const newStickyMessage = await message.channel.send(messageContent);

            // Update the message ID in data
            sticky.messageId = newStickyMessage.id;
            sticky.lastUpdated = Date.now();
            stickyData[channelId] = sticky;
            this.saveStickyData(stickyData);

        } catch (error) {
            console.error('Error handling sticky message:', error);
        }
    }

    static cleanupSticky(channelId) {
        const stickyData = this.loadStickyData();
        if (stickyData[channelId]) {
            delete stickyData[channelId];
            this.saveStickyData(stickyData);
        }
    }

    /**
     * Validate and repair sticky data integrity
     * @param {Client} client - Discord client
     */
    static async validateStickyIntegrity(client) {
        const stickyData = this.loadStickyData();
        let repaired = false;

        for (const channelId in stickyData) {
            const sticky = stickyData[channelId];

            try {
                const channel = await client.channels.fetch(channelId);
                if (!channel) {
                    console.log(`Removing sticky data for non-existent channel: ${channelId}`);
                    delete stickyData[channelId];
                    repaired = true;
                    continue;
                }

                // Check if sticky message still exists
                try {
                    await channel.messages.fetch(sticky.messageId);
                } catch (error) {
                    console.log(`Sticky message not found, recreating for channel: ${channelId}`);

                    // Recreate the sticky message
                    const messageContent = this.createStickyContent(sticky);
                    const newStickyMessage = await channel.send(messageContent);

                    sticky.messageId = newStickyMessage.id;
                    sticky.lastRepaired = Date.now();
                    repaired = true;
                }

            } catch (error) {
                console.error(`Error validating sticky for channel ${channelId}:`, error);
            }
        }

        if (repaired) {
            this.saveStickyData(stickyData);
            console.log('✅ Sticky data integrity validated and repaired');
        }
    }
}

module.exports = StickyManager;
