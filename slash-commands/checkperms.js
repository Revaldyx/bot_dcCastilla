const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const REQUIRED_PERMISSIONS = [
    { name: 'View Channel', flag: PermissionFlagsBits.ViewChannel },
    { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
    { name: 'Embed Links', flag: PermissionFlagsBits.EmbedLinks },
    { name: 'Attach Files', flag: PermissionFlagsBits.AttachFiles },
    { name: 'Manage Messages', flag: PermissionFlagsBits.ManageMessages },
    { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory },
    { name: 'Add Reactions', flag: PermissionFlagsBits.AddReactions },
    { name: 'Use External Emojis', flag: PermissionFlagsBits.UseExternalEmojis },
    { name: 'Mention Everyone', flag: PermissionFlagsBits.MentionEveryone },
    { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkperms')
        .setDescription('Cek semua permission penting yang dibutuhkan bot di channel ini'),

    async execute(interaction) {
        if (interaction.user.id !== '403174107904081933') {
            return interaction.reply({
                content: '❌ Command ini hanya bisa digunakan oleh developer.',
                ephemeral: true
            });
        }
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Command ini hanya bisa dijalankan di server.',
                ephemeral: true
            });
        }

        const botMember = interaction.guild.members.me;
        const channel = interaction.channel;
        const perms = channel.permissionsFor(botMember);

        if (!perms) {
            return interaction.reply({
                content: '❌ Bot tidak dapat membaca permission di channel ini.',
                ephemeral: true
            });
        }

        const missing = [];
        const available = [];

        for (const perm of REQUIRED_PERMISSIONS) {
            if (perms.has(perm.flag)) {
                available.push(perm.name);
            } else {
                missing.push(perm.name);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🔎 Bot Permission Checker')
            .setColor(missing.length === 0 ? config.successColor : config.errorColor)
            .setDescription(
                missing.length === 0
                    ? '✅ Semua permission penting tersedia!'
                    : `❌ Ada permission yang kurang!`
            )
            .addFields(
                { name: 'Tersedia', value: available.length ? available.join(', ') : '-', inline: false },
                { name: 'Kurang', value: missing.length ? missing.join(', ') : '-', inline: false }
            )
            .setFooter({ text: `Bot: ${interaction.client.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
