const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const StickyManager = require('../utils/stickyManager');
const EmbedUtils = require('../utils/embedUtils');
const fs = require('fs');
const path = require('path');

const stickyDataPath = path.join(__dirname, '..', 'data', 'sticky.json');

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

function saveStickyData(data) {
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

module.exports = {
    name: 'sticky',
    description: 'Kelola sticky message di channel. Format: !sticky [embed|plain|remove|status|protect] ...',
    async execute(message, args, client) {
        // Permission check
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Kamu butuh permission **Manage Messages** untuk menggunakan command ini!');
        }

        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageMessages
        ];
        if (!botPermissions.has(requiredPerms)) {
            return message.reply('❌ Bot butuh permission **Send Messages**, **Embed Links**, dan **Manage Messages**!');
        }

        const sub = (args[0] || '').toLowerCase();
        const channelId = message.channel.id;
        const stickyData = loadStickyData();

        if (sub === 'embed') {
            // !sticky embed <title>|<desc>|[image]|[color]
            const input = args.slice(1).join(' ').split('|');
            const title = input[0] || '📌 Sticky Message';
            const desc = input[1] || '';
            const image = input[2] || null;
            const color = input[3] || config.embedColor;

            if (!desc) {
                const errorMsg = await message.reply('❌ Deskripsi sticky tidak boleh kosong!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }

            if (image && !StickyManager.validateImageUrl(image)) {
                const errorMsg = await message.reply('❌ URL gambar tidak valid!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }

            // Send embed sticky
            try {
                if (stickyData[channelId]) {
                    // Remove old sticky
                    try {
                        const oldMsg = await message.channel.messages.fetch(stickyData[channelId].messageId);
                        await oldMsg.delete();
                    } catch { }
                }

                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(desc)
                    .setColor(color);

                if (image) embed.setImage(image);
                embed.setFooter({ text: 'Pesan ini akan selalu muncul di atas' }).setTimestamp();

                const sent = await message.channel.send({ embeds: [embed] });

                stickyData[channelId] = {
                    messageId: sent.id,
                    type: 'embed',
                    content: desc,
                    title,
                    image,
                    color,
                    timestamp: true,
                    authorId: message.author.id,
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    protected: false,
                    errorCount: 0,
                    disabled: false
                };
                saveStickyData(stickyData);

                // Delete user's command message
                try {
                    await message.delete();
                } catch (error) {
                    console.warn('Could not delete command message:', error);
                }

                // Send notification and delete after 3 seconds
                const notification = await message.channel.send(`✅ Sticky embed berhasil diset!\n🔗 [Jump to message](${sent.url})`);
                setTimeout(async () => {
                    try {
                        await notification.delete();
                    } catch (error) {
                        console.warn('Could not delete notification:', error);
                    }
                }, 3000);
            } catch (err) {
                console.error('Sticky embed error:', err);
                const errorMsg = await message.reply('❌ Gagal membuat sticky embed!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
            }
        } else if (sub === 'plain') {
            // !sticky plain <pesan> [image]
            const content = args.slice(1).join(' ');
            const imageMatch = content.match(/(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))/i);
            const image = imageMatch ? imageMatch[0] : null;
            const text = image ? content.replace(image, '').trim() : content;

            if (!text) {
                const errorMsg = await message.reply('❌ Pesan sticky tidak boleh kosong!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }

            if (image && !StickyManager.validateImageUrl(image)) {
                const errorMsg = await message.reply('❌ URL gambar tidak valid!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }

            try {
                if (stickyData[channelId]) {
                    try {
                        const oldMsg = await message.channel.messages.fetch(stickyData[channelId].messageId);
                        await oldMsg.delete();
                    } catch { }
                }

                const msgOptions = { content: text };
                if (image) msgOptions.files = [{ attachment: image, name: 'sticky-image.png' }];

                const sent = await message.channel.send(msgOptions);

                stickyData[channelId] = {
                    messageId: sent.id,
                    type: 'plain',
                    content: text,
                    image: image || null,
                    authorId: message.author.id,
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    protected: false,
                    errorCount: 0,
                    disabled: false
                };
                saveStickyData(stickyData);

                // Delete user's command message
                try {
                    await message.delete();
                } catch (error) {
                    console.warn('Could not delete command message:', error);
                }

                // Send notification and delete after 3 seconds
                const notification = await message.channel.send(`✅ Sticky plain berhasil diset!\n🔗 [Jump to message](${sent.url})`);
                setTimeout(async () => {
                    try {
                        await notification.delete();
                    } catch (error) {
                        console.warn('Could not delete notification:', error);
                    }
                }, 3000);
            } catch (err) {
                console.error('Sticky plain error:', err);
                const errorMsg = await message.reply('❌ Gagal membuat sticky plain!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
            }
        } else if (sub === 'remove') {
            if (!stickyData[channelId]) {
                const errorMsg = await message.reply('❌ Tidak ada sticky message di channel ini!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }
            try {
                const stickyMessageId = stickyData[channelId].messageId;
                try {
                    const stickyMessage = await message.channel.messages.fetch(stickyMessageId);
                    await stickyMessage.delete();
                } catch { }
                delete stickyData[channelId];
                saveStickyData(stickyData);
                const successMsg = await message.reply('✅ Sticky message berhasil dihapus!');
                setTimeout(async () => {
                    try {
                        await successMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete success notification:', error);
                    }
                }, 3000);
            } catch (err) {
                console.error('Sticky remove error:', err);
                const errorMsg = await message.reply('❌ Gagal menghapus sticky message!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
            }
        } else if (sub === 'status') {
            if (!stickyData[channelId]) {
                const errorMsg = await message.reply('❌ Tidak ada sticky message di channel ini!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }
            const sticky = stickyData[channelId];
            const createdAt = new Date(sticky.createdAt);
            const embed = new EmbedBuilder()
                .setTitle('📌 Sticky Message Status')
                .addFields(
                    { name: 'Type', value: sticky.type || 'embed', inline: true },
                    { name: 'Created', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Protected', value: sticky.protected ? '🔒 Yes' : '🔓 No', inline: true },
                    { name: 'Status', value: sticky.disabled ? '❌ Disabled' : '✅ Active', inline: true },
                    { name: 'Delay', value: `${(config.stickyDelay || 10000) / 1000} seconds`, inline: true }
                )
                .setColor(config.embedColor)
                .setTimestamp();

            if (sticky.type === 'embed') {
                embed.addFields(
                    { name: 'Title', value: sticky.title || 'No title', inline: true },
                    { name: 'Color', value: sticky.color || config.embedColor, inline: true }
                );
            }
            if (sticky.content) {
                const preview = sticky.content.length > 500
                    ? sticky.content.substring(0, 500) + '...'
                    : sticky.content;
                embed.addFields({ name: 'Content Preview', value: `\`\`\`${preview}\`\`\`` });
            }
            if (sticky.image) {
                embed.addFields({ name: 'Image URL', value: sticky.image });
                embed.setThumbnail(sticky.image);
            }
            if (sticky.errorCount > 0) {
                embed.addFields({
                    name: '⚠️ Error Count',
                    value: `${sticky.errorCount} errors`,
                    inline: true
                });
            }
            message.reply({ embeds: [embed] });
        } else if (sub === 'protect') {
            // !sticky protect [on|off]
            if (!stickyData[channelId]) {
                const errorMsg = await message.reply('❌ Tidak ada sticky message di channel ini!');
                setTimeout(async () => {
                    try {
                        await errorMsg.delete();
                    } catch (error) {
                        console.warn('Could not delete error notification:', error);
                    }
                }, 3000);
                return;
            }
            const enabled = (args[1] || '').toLowerCase() === 'on';
            stickyData[channelId].protected = enabled;
            saveStickyData(stickyData);
            const successMsg = await message.reply(`✅ Protection sticky message berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}!`);
            setTimeout(async () => {
                try {
                    await successMsg.delete();
                } catch (error) {
                    console.warn('Could not delete success notification:', error);
                }
            }, 3000);
        } else {
            // Help
            message.reply(
                '**Sticky Command Usage:**\n' +
                '`!sticky embed <judul>|<deskripsi>|[image_url]|[color]`\n' +
                '`!sticky plain <pesan> [image_url]`\n' +
                '`!sticky remove`\n' +
                '`!sticky status`\n' +
                '`!sticky protect [on|off]`\n' +
                '\nContoh:\n' +
                '`!sticky embed Welcome|Selamat datang di channel ini!|https://imgur.com/xxx.png|#ff0000`\n' +
                '`!sticky plain Pesan sticky biasa`\n' +
                `\n⏰ Sticky message akan muncul kembali setelah ${(config.stickyDelay || 10000) / 1000} detik user lain mengirim pesan.`
            );
        }
    }
};
