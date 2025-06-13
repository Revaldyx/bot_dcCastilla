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
            const stickyEmbed = new EmbedBuilder()
                .setTitle('📌 Sticky Message')
                .setDescription(sticky.content)
                .setColor(config.embedColor)
                .setFooter({ text: 'Pesan ini akan selalu muncul di atas' })
                .setTimestamp();

            const newStickyMessage = await message.channel.send({ embeds: [stickyEmbed] });

            // Update the message ID in data
            sticky.messageId = newStickyMessage.id;
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
}

module.exports = StickyManager;
