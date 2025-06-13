const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const StickyManager = require('../utils/stickyManager');

module.exports = {
    name: 'hapus',
    description: 'Hapus semua pesan di channel (atau jumlah tertentu). Usage: !hapus [jumlah] atau !hapus all',
    async execute(message, args) {
        // Check if user has manage messages permission
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Kamu butuh permission **Manage Messages** untuk menggunakan command ini!');
        }

        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ReadMessageHistory
        ];

        if (!botPermissions.has(requiredPerms)) {
            const missingPerms = [];
            if (!botPermissions.has(PermissionFlagsBits.SendMessages)) missingPerms.push('Send Messages');
            if (!botPermissions.has(PermissionFlagsBits.ManageMessages)) missingPerms.push('Manage Messages');
            if (!botPermissions.has(PermissionFlagsBits.ReadMessageHistory)) missingPerms.push('Read Message History');

            return message.reply(`❌ Bot butuh permission berikut:\n- ${missingPerms.join('\n- ')}`);
        }

        const amount = args[0];
        let deleteCount = 0;
        let isDeleteAll = false;

        // Parse arguments
        if (!amount) {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🗑️ Hapus Command Help')
                .setDescription('**Usage:**\n`!hapus <jumlah>` - Hapus jumlah pesan tertentu (1-100)\n`!hapus all` - Hapus semua pesan di channel\n\n**Contoh:**\n`!hapus 10` - Hapus 10 pesan terakhir\n`!hapus all` - Hapus semua pesan')
                .setColor(config.embedColor)
                .setFooter({ text: 'Hati-hati! Pesan yang dihapus tidak bisa dikembalikan!' });

            return message.channel.send({ embeds: [helpEmbed] });
        }

        if (amount.toLowerCase() === 'all') {
            isDeleteAll = true;
        } else {
            deleteCount = parseInt(amount);
            if (isNaN(deleteCount) || deleteCount < 1 || deleteCount > 100) {
                return message.reply('❌ Jumlah pesan harus berupa angka antara 1-100!');
            }
        }

        // Check for sticky messages in channel
        const stickyData = StickyManager.getStickyForChannel(message.channel.id);
        let hasStickyMessage = false;
        let stickyMessageId = null;

        if (stickyData) {
            hasStickyMessage = true;
            stickyMessageId = stickyData.messageId;
        }

        // Confirmation for deleting all messages
        if (isDeleteAll) {
            let confirmDescription = `**Apakah kamu yakin ingin menghapus SEMUA pesan di channel #${message.channel.name}?**\n\nTindakan ini tidak dapat dibatalkan!`;

            if (hasStickyMessage) {
                confirmDescription += `\n\n⚠️ **Peringatan:** Channel ini memiliki sticky message yang akan tetap ada setelah penghapusan.`;
            }

            confirmDescription += `\n\nKetik \`confirm\` dalam 30 detik untuk melanjutkan.`;

            const confirmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Konfirmasi Hapus Semua Pesan')
                .setDescription(confirmDescription)
                .setColor(config.warningColor)
                .setFooter({ text: 'Timeout dalam 30 detik' });

            const confirmMsg = await message.channel.send({ embeds: [confirmEmbed] });

            try {
                const filter = response => {
                    return response.author.id === message.author.id && response.content.toLowerCase() === 'confirm';
                };

                const collected = await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });

                // Delete confirmation messages
                await confirmMsg.delete().catch(() => { });
                await collected.first().delete().catch(() => { });

            } catch (error) {
                await confirmMsg.edit({
                    embeds: [new EmbedBuilder()
                        .setTitle('❌ Timeout')
                        .setDescription('Konfirmasi tidak diterima dalam waktu yang ditentukan.')
                        .setColor(config.errorColor)]
                });
                return;
            }
        }

        // Delete the command message first
        try {
            await message.delete();
        } catch (error) {
            console.log('Could not delete command message:', error.message);
        }

        // Start deletion process
        const statusMsg = await message.channel.send('🗑️ Memulai penghapusan pesan...');

        try {
            let totalDeleted = 0;
            let hasMoreMessages = true;
            let batchCount = 0;
            let stickyProtected = 0;

            while (hasMoreMessages) {
                try {
                    // Fetch messages
                    const fetchLimit = isDeleteAll ? 100 : Math.min(deleteCount - totalDeleted, 100);
                    const messages = await message.channel.messages.fetch({
                        limit: fetchLimit,
                        before: statusMsg.id // Don't delete the status message
                    });

                    if (messages.size === 0) {
                        hasMoreMessages = false;
                        break;
                    }

                    // Filter out sticky messages and status message
                    const filteredMessages = messages.filter(msg => {
                        // Don't delete status message
                        if (msg.id === statusMsg.id) return false;

                        // Don't delete sticky messages
                        if (hasStickyMessage && msg.id === stickyMessageId) {
                            stickyProtected++;
                            return false;
                        }

                        return true;
                    });

                    if (filteredMessages.size === 0) {
                        hasMoreMessages = false;
                        break;
                    }

                    // Filter messages by age (Discord can only bulk delete messages newer than 14 days)
                    const now = Date.now();
                    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

                    const recentMessages = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
                    const oldMessages = filteredMessages.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

                    // Bulk delete recent messages
                    if (recentMessages.size > 0) {
                        if (recentMessages.size === 1) {
                            await recentMessages.first().delete();
                        } else {
                            await message.channel.bulkDelete(recentMessages, true);
                        }
                        totalDeleted += recentMessages.size;
                    }

                    // Delete old messages individually
                    for (const oldMessage of oldMessages.values()) {
                        try {
                            await oldMessage.delete();
                            totalDeleted++;
                            // Small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (error) {
                            console.log('Could not delete old message:', error.message);
                        }
                    }

                    batchCount++;

                    // Update status every 5 batches or if we're done
                    if (batchCount % 5 === 0 || !isDeleteAll) {
                        try {
                            let statusText = `🗑️ Menghapus pesan... (${totalDeleted} terhapus)`;
                            if (stickyProtected > 0) {
                                statusText += ` | ${stickyProtected} sticky dilindungi`;
                            }
                            await statusMsg.edit(statusText);
                        } catch (error) {
                            // Status message might be deleted, continue anyway
                        }
                    }

                    // Check if we should continue
                    if (!isDeleteAll && totalDeleted >= deleteCount) {
                        hasMoreMessages = false;
                    }

                    // Rate limit protection
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error('Error in batch deletion:', error);

                    if (error.code === 50034) {
                        // Can only bulk delete messages that are under 14 days old
                        console.log('Encountered old messages, switching to individual deletion');
                        continue;
                    } else if (error.code === 50013) {
                        throw new Error('Bot kehilangan permission selama proses penghapusan!');
                    } else {
                        throw error;
                    }
                }
            }

            // Final status update
            let resultDescription = `**${totalDeleted}** pesan berhasil dihapus dari channel #${message.channel.name}`;
            if (stickyProtected > 0) {
                resultDescription += `\n🛡️ **${stickyProtected}** sticky message dilindungi dari penghapusan`;
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle('✅ Penghapusan Selesai')
                .setDescription(resultDescription)
                .setColor(config.successColor)
                .setFooter({ text: `Dihapus oleh ${message.author.tag}` })
                .setTimestamp();

            try {
                await statusMsg.edit({ content: null, embeds: [resultEmbed] });

                // Auto-delete result message after 10 seconds
                setTimeout(async () => {
                    try {
                        await statusMsg.delete();
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, 10000);
            } catch (error) {
                // If we can't edit the status message, send a new one
                const newMsg = await message.channel.send({ embeds: [resultEmbed] });
                setTimeout(async () => {
                    try {
                        await newMsg.delete();
                    } catch (error) {
                        // Message might already be deleted
                    }
                }, 10000);
            }

        } catch (error) {
            console.error('Error during message deletion:', error);

            let errorMsg = 'Terjadi error saat menghapus pesan!';
            if (error.code === 50013) {
                errorMsg = 'Bot tidak memiliki permission yang cukup!';
            } else if (error.code === 50034) {
                errorMsg = 'Tidak bisa menghapus pesan yang lebih dari 14 hari!';
            } else if (error.message) {
                errorMsg = error.message;
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription(errorMsg)
                .setColor(config.errorColor);

            try {
                await statusMsg.edit({ content: null, embeds: [errorEmbed] });
            } catch (editError) {
                try {
                    await message.channel.send({ embeds: [errorEmbed] });
                } catch (sendError) {
                    console.error('Cannot send error message:', sendError);
                }
            }
        }
    }
};
