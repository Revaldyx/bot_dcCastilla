const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

// File to store sticky messages data
const stickyDataPath = path.join(__dirname, '..', 'data', 'sticky.json');

// Ensure data directory exists
const dataDir = path.dirname(stickyDataPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load sticky data
function loadStickyData() {
    try {
        if (fs.existsSync(stickyDataPath)) {
            return JSON.parse(fs.readFileSync(stickyDataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading sticky data:', error);
    }
    return {};
}

// Save sticky data
function saveStickyData(data) {
    try {
        fs.writeFileSync(stickyDataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving sticky data:', error);
    }
}

module.exports = {
    name: 'sticky',
    description: 'Kelola sticky message di channel (set/remove/status)',
    async execute(message, args) {
        // Check if user has manage messages permission
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Kamu butuh permission **Manage Messages** untuk menggunakan command ini!');
        }

        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageMessages];

        if (!botPermissions.has(requiredPerms)) {
            return message.reply('❌ Bot butuh permission **Send Messages**, **Embed Links**, dan **Manage Messages**!');
        }

        const subCommand = args[0]?.toLowerCase();
        const channelId = message.channel.id;
        const stickyData = loadStickyData();

        if (!subCommand) {
            const embed = new EmbedBuilder()
                .setTitle('📌 Sticky Message Commands')
                .setDescription('**Usage:**\n`!sticky set <message>` - Set sticky message\n`!sticky remove` - Remove sticky message\n`!sticky status` - Check sticky status')
                .setColor(config.embedColor)
                .setFooter({ text: 'Sticky messages will repost automatically when new messages are sent' });

            return message.channel.send({ embeds: [embed] });
        }

        switch (subCommand) {
            case 'set': {
                const stickyMessage = args.slice(1).join(' ');
                if (!stickyMessage) {
                    return message.reply('❌ Masukkan pesan yang ingin dijadikan sticky!\nContoh: `!sticky set Selamat datang di channel ini!`');
                }

                // Create sticky message embed
                const stickyEmbed = new EmbedBuilder()
                    .setTitle('📌 Sticky Message')
                    .setDescription(stickyMessage)
                    .setColor(config.embedColor)
                    // .setFooter({ text: 'Pesan ini akan selalu muncul di atas' })
                    .setTimestamp();

                try {
                    // Send the sticky message
                    const sentMessage = await message.channel.send({ embeds: [stickyEmbed] });

                    // Save sticky data
                    stickyData[channelId] = {
                        messageId: sentMessage.id,
                        content: stickyMessage,
                        authorId: message.author.id,
                        createdAt: Date.now()
                    };
                    saveStickyData(stickyData);

                    // Delete the command message
                    try {
                        await message.delete();
                    } catch (error) {
                        console.log('Could not delete command message:', error.message);
                    }

                    // Send confirmation in DM or temporary message
                    try {
                        await message.author.send(`✅ Sticky message berhasil diset di channel #${message.channel.name}!`);
                    } catch (dmError) {
                        const confirmMsg = await message.channel.send(`✅ Sticky message berhasil diset oleh ${message.author}!`);
                        setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
                    }

                } catch (error) {
                    console.error('Error setting sticky message:', error);
                    return message.reply('❌ Gagal membuat sticky message!');
                }
                break;
            }

            case 'remove': {
                if (!stickyData[channelId]) {
                    return message.reply('❌ Tidak ada sticky message di channel ini!');
                }

                try {
                    // Try to delete the sticky message
                    const channel = message.channel;
                    const stickyMessageId = stickyData[channelId].messageId;

                    try {
                        const stickyMessage = await channel.messages.fetch(stickyMessageId);
                        await stickyMessage.delete();
                    } catch (fetchError) {
                        console.log('Sticky message already deleted or not found');
                    }

                    // Remove from data
                    delete stickyData[channelId];
                    saveStickyData(stickyData);

                    await message.reply('✅ Sticky message berhasil dihapus!');

                } catch (error) {
                    console.error('Error removing sticky message:', error);
                    return message.reply('❌ Gagal menghapus sticky message!');
                }
                break;
            }

            case 'status': {
                if (!stickyData[channelId]) {
                    return message.reply('❌ Tidak ada sticky message di channel ini!');
                }

                const sticky = stickyData[channelId];
                const author = await message.client.users.fetch(sticky.authorId).catch(() => null);
                const createdAt = new Date(sticky.createdAt);

                const embed = new EmbedBuilder()
                    .setTitle('📌 Sticky Message Status')
                    .addFields(
                        { name: 'Channel', value: `#${message.channel.name}`, inline: true },
                        { name: 'Author', value: author ? author.tag : 'Unknown', inline: true },
                        { name: 'Created', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true },
                        { name: 'Content', value: sticky.content.length > 1000 ? sticky.content.substring(0, 1000) + '...' : sticky.content }
                    )
                    .setColor(config.embedColor)
                    .setTimestamp();

                await message.channel.send({ embeds: [embed] });
                break;
            }

            default:
                return message.reply('❌ Sub-command tidak valid! Gunakan: `set`, `remove`, atau `status`');
        }
    }
};
