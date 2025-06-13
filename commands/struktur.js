const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'struktur',
    description: 'Menampilkan struktur organisasi Castilla',
    async execute(message, args) {
        // Check bot permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

        if (!botPermissions.has(requiredPerms)) {
            const missingPerms = [];
            if (!botPermissions.has(PermissionFlagsBits.SendMessages)) missingPerms.push('Send Messages');
            if (!botPermissions.has(PermissionFlagsBits.EmbedLinks)) missingPerms.push('Embed Links');

            try {
                await message.author.send(`❌ Bot tidak memiliki permission berikut di channel #${message.channel.name}:\n- ${missingPerms.join('\n- ')}\n\nMinta admin server untuk memberikan permission ini kepada bot.`);
            } catch (dmError) {
                console.error('Cannot send DM to user:', dmError);
            }
            return;
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle('**STRUKTUR ORGANISASI CASTILLA**')
                .setColor('#8B4513')
                .setDescription('**Keterangan:**\n```Yang tulisannya tebal = Commander/Petinggi\nYang tidak tebal = Member/Relasi```')
                .addFields(
                    {
                        name: '👑 **Le Patron (Boss)**',
                        value: '**• Valdyx ST Castilla** <@403174107904081933>',
                        inline: false
                    },
                    {
                        name: '💎 **La Marraine (Godmother)**',
                        value: '**• Michella Castilla** <@913276778091536384>',
                        inline: false
                    },
                    {
                        name: '🎯 **Le Conseiller (Advisor)**',
                        value: '**• Grey Havi** <@492154729582034948>\n**• Aksara Abimana** <@1058968902220128276>\n**• Maura Olydia Castilla** <@1299896223083532291>',
                        inline: false
                    },
                    {
                        name: '⚔️ **Les Capitaines (Captains)**',
                        value: '**• Biru Castilla** <@762836598080536588>\n**• Mattheo Castilla** <@486491828238155787>',
                        inline: false
                    },
                    {
                        name: '💼 **Les Courtiers (Brokers)**',
                        value: '• ZeSakura Tetzu\n• Keiisya Rose\n• Baut Castilla\n• Asep Castilla\n• Denz Castilla\n• Flora Cloveynera\n• Walther White\n• Boy Castilla\n• Arth Rose',
                        inline: false
                    },
                    {
                        name: '🔫 **Les Soldats (Soldier)**',
                        value: '• \n• \n• ',
                        inline: false
                    },
                    {
                        name: '🤝 **Les Recrues (Relasi)**',
                        value: '• Cyamiaw Castilla\n• \n• ',
                        inline: false
                    }
                )
                .setFooter({ text: 'Castilla Mafia Structure' })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error sending struktur embed:', error);

            if (error.code === 50013) {
                try {
                    await message.author.send('❌ Bot tidak memiliki permission yang cukup untuk mengirim embed di channel tersebut!');
                } catch (dmError) {
                    console.error('Cannot send DM to user:', dmError);
                }
            } else {
                try {
                    await message.reply('❌ Gagal mengirim struktur embed!');
                } catch (replyError) {
                    console.error('Cannot reply to message:', replyError);
                }
            }
        }
    }
};
