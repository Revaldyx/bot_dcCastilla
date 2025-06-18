const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');
const { fetch, isAvailable: fetchAvailable } = require('./fetchPolyfill');

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

        // Check if message is protected (optional feature)
        if (sticky.protected && Date.now() - sticky.lastUpdated < (config.stickyDelay || 2000)) {
            return;
        }

        try {
            // Try to delete the old sticky message
            try {
                const oldStickyMessage = await message.channel.messages.fetch(sticky.messageId);
                await oldStickyMessage.delete();
            } catch (fetchError) {
                console.log('Old sticky message not found, creating new one');
            }

            // Create new sticky message based on type
            let newStickyMessage;

            if (sticky.type === 'embed') {
                const stickyEmbed = new EmbedBuilder()
                    .setTitle(sticky.title || '📌 Sticky Message')
                    .setDescription(sticky.content)
                    .setColor(sticky.color || config.embedColor);

                if (sticky.footer !== false) {
                    stickyEmbed.setFooter({ text: sticky.footer || 'Pesan ini akan selalu muncul di atas' });
                }

                if (sticky.timestamp !== false) {
                    stickyEmbed.setTimestamp();
                }

                if (sticky.image) {
                    stickyEmbed.setImage(sticky.image);
                }

                if (sticky.thumbnail) {
                    stickyEmbed.setThumbnail(sticky.thumbnail);
                }

                newStickyMessage = await message.channel.send({ embeds: [stickyEmbed] });

            } else if (sticky.type === 'plain') {
                const messageOptions = {
                    content: sticky.content
                };

                if (sticky.image) {
                    messageOptions.files = [{ attachment: sticky.image, name: 'sticky-image.png' }];
                }

                newStickyMessage = await message.channel.send(messageOptions);
            }

            // Update the message ID and timestamp in data
            sticky.messageId = newStickyMessage.id;
            sticky.lastUpdated = Date.now();
            stickyData[channelId] = sticky;
            this.saveStickyData(stickyData);

        } catch (error) {
            console.error('Error handling sticky message:', error);

            // If sticky fails too many times, disable it temporarily
            if (!sticky.errorCount) sticky.errorCount = 0;
            sticky.errorCount++;

            if (sticky.errorCount >= 5) {
                console.warn(`Disabling sticky in channel ${channelId} due to repeated errors`);
                sticky.disabled = true;
            }

            this.saveStickyData(stickyData);
        }
    }

    static cleanupSticky(channelId) {
        const stickyData = this.loadStickyData();
        if (stickyData[channelId]) {
            delete stickyData[channelId];
            this.saveStickyData(stickyData);
        }
    }

    static validateImageUrl(url) {
        if (!url) return true;

        try {
            const urlObj = new URL(url);
            const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
            const pathname = urlObj.pathname.toLowerCase();

            // Check file extension
            const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));

            // Check trusted domains
            const trustedDomains = [
                'discord.com', 'discordapp.com', 'cdn.discordapp.com',
                'imgur.com', 'i.imgur.com',
                'github.com', 'raw.githubusercontent.com',
                'cdn.'
            ];

            const isTrustedDomain = trustedDomains.some(domain =>
                urlObj.hostname.includes(domain)
            );

            return hasValidExtension || isTrustedDomain;
        } catch {
            return false;
        }
    }

    static async testImageUrl(url) {
        if (!url) return true;

        // If fetch is not available, use basic validation
        if (!fetchAvailable) {
            console.warn('Fetch not available, using basic URL validation for image test');
            return this.validateImageUrl(url);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            return response.ok && contentType && contentType.startsWith('image/');
        } catch (error) {
            console.warn('Image URL test failed:', error.message);
            // Fallback to basic validation if network test fails
            return this.validateImageUrl(url);
        }
    }
}

module.exports = StickyManager;
