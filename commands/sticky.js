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

        const NOTIF_DELETE_MS = 5000;

        // Helper untuk notifikasi embed
        async function sendNotif(type, desc) {
            const embed = EmbedUtils.createQuickEmbed(
                type,
                type === 'success' ? 'Berhasil' : 'Gagal',
                desc,
                { timestamp: false }
            );
            const notif = await message.channel.send({ embeds: [embed] });
            setTimeout(async () => {
                try { await notif.delete(); } catch { }
            }, NOTIF_DELETE_MS);
        }

        if (sub === 'embed') {
            // !sticky embed <title>|<desc>|[image]|[color]
            const input = args.slice(1).join(' ').split('|');
            const title = input[0] || '📌 Sticky Message';
            const desc = input[1] || '';
            const image = input[2] || null;
            const color = input[3] || config.embedColor;

            if (!desc) {
                await sendNotif('error', 'Deskripsi sticky tidak boleh kosong!');
                return;
            }

            if (image && !StickyManager.validateImageUrl(image)) {
                await sendNotif('error', 'URL gambar tidak valid!');
                return;
            }

            // Send embed sticky
            try {
                if (stickyData[channelId]) {
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
                setTimeout(async () => {
                    try { await message.delete(); } catch { }
                }, NOTIF_DELETE_MS);

                // Notifikasi sukses
                await sendNotif('success', `Sticky embed berhasil diset!\n[Klik untuk melihat pesan](${sent.url})`);
            } catch (err) {
                console.error('Sticky embed error:', err);
                await sendNotif('error', 'Gagal membuat sticky embed!');
            }
        } else if (sub === 'plain') {
            // !sticky plain <pesan> [image]
            const content = args.slice(1).join(' ');
            const imageMatch = content.match(/(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp))/i);
            const image = imageMatch ? imageMatch[0] : null;
            const text = image ? content.replace(image, '').trim() : content;

            if (!text) {
                await sendNotif('error', 'Pesan sticky tidak boleh kosong!');
                return;
            }

            if (image && !StickyManager.validateImageUrl(image)) {
                await sendNotif('error', 'URL gambar tidak valid!');
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

                setTimeout(async () => {
                    try { await message.delete(); } catch { }
                }, NOTIF_DELETE_MS);

                await sendNotif('success', `Sticky plain berhasil diset!\n[Klik untuk melihat pesan](${sent.url})`);
            } catch (err) {
                console.error('Sticky plain error:', err);
                await sendNotif('error', 'Gagal membuat sticky plain!');
            }
        } else if (sub === 'remove') {
            if (!stickyData[channelId]) {
                await sendNotif('error', 'Tidak ada sticky message di channel ini!');
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
                await sendNotif('success', 'Sticky message berhasil dihapus!');
            } catch (err) {
                console.error('Sticky remove error:', err);
                await sendNotif('error', 'Gagal menghapus sticky message!');
            }
        } else if (sub === 'status') {
            if (!stickyData[channelId]) {
                await sendNotif('error', 'Tidak ada sticky message di channel ini!');
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
            message.reply({ embeds: [embed] }).then(msg => {
                setTimeout(async () => {
                    try { await msg.delete(); } catch { }
                }, NOTIF_DELETE_MS);
            });
        } else if (sub === 'protect') {
            // !sticky protect [on|off]
            if (!stickyData[channelId]) {
                await sendNotif('error', 'Tidak ada sticky message di channel ini!');
                return;
            }
            const enabled = (args[1] || '').toLowerCase() === 'on';
            stickyData[channelId].protected = enabled;
            saveStickyData(stickyData);
            await sendNotif('success', `Protection sticky message berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}!`);
        } else {
            // Help
            const helpEmbed = EmbedUtils.createQuickEmbed(
                'info',
                'Sticky Command Usage',
                [
                    '`!sticky embed <judul>|<deskripsi>|[image_url]|[color]`',
                    '`!sticky plain <pesan> [image_url]`',
                    '`!sticky remove`',
                    '`!sticky status`',
                    '`!sticky protect [on|off]`',
                    '',
                    'Contoh:',
                    '`!sticky embed Welcome|Selamat datang di channel ini!|https://imgur.com/xxx.png|#ff0000`',
                    '`!sticky plain Pesan sticky biasa`',
                    '',
                    `⏰ Sticky message akan muncul kembali setelah ${(config.stickyDelay || 10000) / 1000} detik user lain mengirim pesan.`
                ].join('\n')
            );
            message.reply({ embeds: [helpEmbed] }).then(msg => {
                setTimeout(async () => {
                    try { await msg.delete(); } catch { }
                }, NOTIF_DELETE_MS);
            });
        }
    }
};
