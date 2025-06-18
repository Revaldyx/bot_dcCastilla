const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan daftar command yang tersedia'),

    async execute(interaction) {
        try {
            const commands = interaction.client.slashCommands;

            const embed = new EmbedBuilder()
                .setTitle('📋 Daftar Slash Command Bot Castilla')
                .setDescription('Berikut adalah daftar slash command yang tersedia:')
                .setColor(config.embedColor)
                .setThumbnail(config.defaultThumbnail);

            commands.forEach(command => {
                embed.addFields({
                    name: `/${command.data.name}`,
                    value: command.data.description || 'Tidak ada deskripsi',
                    inline: true
                });
            });

            embed.setFooter({
                text: `Total Commands: ${commands.size}`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in help slash command:', error);
            await interaction.reply({ content: '❌ Gagal menampilkan daftar command!', ephemeral: true });
        }
    }
};
