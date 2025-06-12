const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'checkperms',
    description: 'Check bot permissions in current channel',
    async execute(message, args) {
        const botMember = message.guild.members.me;
        const channelPermissions = message.channel.permissionsFor(botMember);

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
            .setDescription(`**Channel:** ${message.channel.name}\n\n**Permissions:**\n${permissionStatus}`)
            .setColor(hasAllPerms ? '#00ff00' : '#ff0000')
            .setTimestamp();

        try {
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            // If we can't send embeds, try sending a plain text message
            try {
                await message.channel.send(`**Bot Permissions:**\n${permissionStatus}`);
            } catch (textError) {
                // If we can't send any message, try to DM the user
                try {
                    await message.author.send(`**Bot Permissions in #${message.channel.name}:**\n${permissionStatus}\n\nBot cannot send messages in that channel!`);
                } catch (dmError) {
                    console.error('Cannot check or report permissions:', dmError);
                }
            }
        }
    }
};
