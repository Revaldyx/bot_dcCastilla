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
    description: 'Kelola sticky message di channel (embed/text/remove/status) dengan dukungan gambar',
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
                .setDescription('**Usage:**\n`!sticky embed <message> [image_url]` - Set sticky message (embed) dengan gambar opsional\n`!sticky text <message> [image_url]` - Set sticky message (plain text) dengan gambar opsional\n`!sticky remove` - Remove sticky message\n`!sticky status` - Check sticky status\n\n**Image Support:**\n- Gunakan URL gambar langsung\n- Atau upload gambar bersamaan dengan command\n- Format yang didukung: JPG, PNG, GIF, WEBP')
                .addFields(
                    {
                        name: 'Contoh dengan URL gambar:',
                        value: '`!sticky embed Selamat datang! https://example.com/image.png`',
                        inline: false
                    },
                    {
                        name: 'Contoh dengan upload gambar:',
                        value: 'Upload gambar dan ketik: `!sticky text Pesan sticky dengan gambar`',
                        inline: false
                    }
                )
                .setColor(config.embedColor)
                .setFooter({ text: 'Sticky messages will repost automatically when new messages are sent' });

            return message.channel.send({ embeds: [embed] });
        }

        // Helper function to extract image URL from message or attachments
        function extractImageUrl(messageContent, attachments) {
            // Check for image URL in message content
            const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/i;
            const urlMatch = messageContent.match(urlRegex);

            if (urlMatch) {
                return urlMatch[1];
            }

            // Check for image attachments
            if (attachments && attachments.size > 0) {
                const imageAttachment = attachments.find(att =>
                    att.contentType && att.contentType.startsWith('image/')
                );
                if (imageAttachment) {
                    return imageAttachment.url;
                }
            }

            return null;
        }

        // Helper function to remove image URL from message content
        function removeImageUrlFromContent(content) {
            const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/i;
            return content.replace(urlRegex, '').trim();
        }

        switch (subCommand) {
            case 'embed': {
                let stickyMessage = args.slice(1).join(' ');
                if (!stickyMessage && message.attachments.size === 0) {
                    return message.reply('❌ Masukkan pesan yang ingin dijadikan sticky!\nContoh: `!sticky embed Selamat datang di channel ini!`\nAtau upload gambar bersamaan dengan pesan.');
                }

                // Extract image URL
                const imageUrl = extractImageUrl(stickyMessage, message.attachments);

                // Remove image URL from content if found in text
                if (imageUrl && stickyMessage.includes(imageUrl)) {
                    stickyMessage = removeImageUrlFromContent(stickyMessage);
                }

                // If no text content and only image, set default message
                if (!stickyMessage && imageUrl) {
                    stickyMessage = 'Sticky Message';
                }

                // Create sticky message embed
                const stickyEmbed = new EmbedBuilder()
                    .setTitle('📌 Sticky Message')
                    .setDescription(stickyMessage)
                    .setColor(config.embedColor)
                    .setTimestamp();

                // Add image if provided
                if (imageUrl) {
                    stickyEmbed.setImage(imageUrl);
                }

                try {
                    // Send the sticky message
                    const sentMessage = await message.channel.send({ embeds: [stickyEmbed] });

                    // Save sticky data (embed format)
                    stickyData[channelId] = {
                        messageId: sentMessage.id,
                        content: stickyMessage,
                        imageUrl: imageUrl || null,
                        authorId: message.author.id,
                        createdAt: Date.now(),
                        isPlainText: false
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
                        await message.author.send(`✅ Sticky message (embed) berhasil diset di channel #${message.channel.name}!`);
                    } catch (dmError) {
                        const confirmMsg = await message.channel.send(`✅ Sticky message (embed) berhasil diset oleh ${message.author}!`);
                        setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
                    }

                } catch (error) {
                    console.error('Error setting sticky message:', error);
                    if (error.code === 50035) {
                        return message.reply('❌ URL gambar tidak valid atau tidak dapat diakses!');
                    }
                    return message.reply('❌ Gagal membuat sticky message!');
                }
                break;
            }

            case 'text': {
                let stickyMessage = args.slice(1).join(' ');
                if (!stickyMessage && message.attachments.size === 0) {
                    return message.reply('❌ Masukkan pesan yang ingin dijadikan sticky!\nContoh: `!sticky text Selamat datang di channel ini!`\nAtau upload gambar bersamaan dengan pesan.');
                }

                // Extract image URL
                const imageUrl = extractImageUrl(stickyMessage, message.attachments);

                // Remove image URL from content if found in text
                if (imageUrl && stickyMessage.includes(imageUrl)) {
                    stickyMessage = removeImageUrlFromContent(stickyMessage);
                }

                console.log('Setting text sticky message:', stickyMessage);
                console.log('Image URL:', imageUrl);

                // Handle code blocks - preserve formatting inside code blocks but clean up outside
                const codeBlockRegex = /```[\s\S]*?```|`[^`]*`/g;
                const codeBlocks = [];
                let tempMessage = stickyMessage;

                // Extract code blocks temporarily
                tempMessage = tempMessage.replace(codeBlockRegex, (match, index) => {
                    codeBlocks.push(match);
                    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
                });

                // Clean up excessive spaces outside code blocks
                tempMessage = tempMessage.replace(/\s+/g, ' ').trim();

                // Restore code blocks
                codeBlocks.forEach((block, index) => {
                    tempMessage = tempMessage.replace(`__CODEBLOCK_${index}__`, block);
                });

                stickyMessage = tempMessage;

                if (stickyMessage.length > config.maxStickyLength) {
                    return message.reply(`❌ Pesan terlalu panjang! Maksimal ${config.maxStickyLength} karakter.`);
                }

                try {
                    // Prepare message content
                    let messageContent = stickyMessage;
                    let messageOptions = { content: messageContent };

                    // Add image as embed if provided (for text sticky with image)
                    if (imageUrl) {
                        const imageEmbed = new EmbedBuilder()
                            .setImage(imageUrl)
                            .setColor(config.embedColor);
                        messageOptions.embeds = [imageEmbed];
                    }

                    // Send the sticky message
                    const sentMessage = await message.channel.send(messageOptions);

                    // Save sticky data (plain text format) with image
                    stickyData[channelId] = {
                        messageId: sentMessage.id,
                        content: stickyMessage,
                        imageUrl: imageUrl || null,
                        authorId: message.author.id,
                        createdAt: Date.now(),
                        isPlainText: true
                    };
                    saveStickyData(stickyData);

                    console.log('Text sticky data saved:', stickyData[channelId]);

                    // Delete the command message
                    try {
                        await message.delete();
                    } catch (error) {
                        console.log('Could not delete command message:', error.message);
                    }

                    // Send confirmation in DM or temporary message
                    try {
                        await message.author.send(`✅ Sticky message (text) berhasil diset di channel #${message.channel.name}!`);
                    } catch (dmError) {
                        const confirmMsg = await message.channel.send(`✅ Sticky message (text) berhasil diset oleh ${message.author}!`);
                        setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
                    }

                } catch (error) {
                    console.error('Error setting text sticky message:', error);
                    if (error.code === 50035) {
                        return message.reply('❌ URL gambar tidak valid atau tidak dapat diakses!');
                    }
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
                        { name: 'Type', value: sticky.isPlainText ? 'Text' : 'Embed', inline: true },
                        { name: 'Author', value: author ? author.tag : 'Unknown', inline: true },
                        { name: 'Created', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true },
                        { name: 'Has Image', value: sticky.imageUrl ? 'Yes' : 'No', inline: true },
                        { name: 'Content', value: sticky.content.length > 1000 ? sticky.content.substring(0, 1000) + '...' : sticky.content }
                    )
                    .setColor(config.embedColor)
                    .setTimestamp();

                // Show image preview if available
                if (sticky.imageUrl) {
                    embed.setThumbnail(sticky.imageUrl);
                    embed.addFields({ name: 'Image URL', value: sticky.imageUrl, inline: false });
                }

                await message.channel.send({ embeds: [embed] });
                break;
            }

            default:
                return message.reply('❌ Sub-command tidak valid! Gunakan: `embed`, `text`, `remove`, atau `status`');
        }
    }
};
