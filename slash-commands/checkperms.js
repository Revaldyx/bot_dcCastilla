const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkperms')
        .setDescription('Check bot permissions in current channel'),

    async execute(interaction) {
        const botMember = interaction.guild.members.me;
        const channelPermissions = interaction.channel.permissionsFor(botMember);

        const requiredPerms = [
            { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
            { name: 'Embed Links', flag: PermissionFlagsBits.EmbedLinks },
            { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory },
            { name: 'Use External Emojis', flag: PermissionFlagsBits.UseExternalEmojis },
            { name: 'Add Reactions', flag: PermissionFlagsBits.AddReactions }
        ];

        let permissionStatus = '';
        let hasAllPerms = true;

        for (const perm of requiredPerms) {
            const hasPermission = channelPermissions.has(perm.flag);
            permissionStatus += `${hasPermission ? '✅' : '❌'} ${perm.name}\n`;
            if (!hasPermission) hasAllPerms = false;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔍 Bot Permission Check')
            .setDescription(`**Channel:** ${interaction.channel.name}\n\n**Permissions:**\n${permissionStatus}`)
            .setColor(hasAllPerms ? '#00ff00' : '#ff0000')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
