const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Hapus sejumlah pesan di channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Jumlah pesan yang akan dihapus (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ Kamu butuh permission **Manage Messages**!', ephemeral: true });
        }

        const botPermissions = interaction.channel.permissionsFor(interaction.guild.members.me);
        const requiredPerms = [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory];

        if (!botPermissions.has(requiredPerms)) {
            return interaction.reply({ content: '❌ Bot butuh permission **Manage Messages** dan **Read Message History**!', ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            await interaction.deferReply({ ephemeral: true });

            const messages = await interaction.channel.messages.fetch({ limit: amount });

            if (messages.size === 0) {
                return interaction.editReply('❌ Tidak ada pesan yang bisa dihapus!');
            }

            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const validMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = messages.size - validMessages.size;

            if (validMessages.size === 0) {
                return interaction.editReply('❌ Semua pesan lebih dari 14 hari, tidak bisa dihapus!');
            }

            const deletedMessages = await interaction.channel.bulkDelete(validMessages, true);

            let reply = `✅ **${deletedMessages.size}** pesan berhasil dihapus!`;
            if (oldMessages > 0) {
                reply += `\n⚠️ ${oldMessages} pesan tidak bisa dihapus karena lebih dari 14 hari`;
            }

            await interaction.editReply(reply);

            console.log(`🗑️ Purge: ${interaction.user.tag} deleted ${deletedMessages.size} messages in #${interaction.channel.name}`);

        } catch (error) {
            console.error('Error in purge slash command:', error);
            await interaction.editReply('❌ Gagal menghapus pesan!');
        }
    }
};
