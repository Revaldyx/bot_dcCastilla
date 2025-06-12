const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar command yang tersedia',
    async execute(message, args, client) {
        try {
            // Get all available commands dynamically
            const commands = Array.from(client.commands.values());

            const embed = new EmbedBuilder()
                .setTitle('📋 Daftar Command Bot Castilla')
                .setDescription('Berikut adalah daftar command yang tersedia:')
                .setColor(config.embedColor)
                .setThumbnail(config.defaultThumbnail);

            // Add commands dynamically
            commands.forEach(command => {
                embed.addFields({
                    name: `${config.prefix}${command.name}`,
                    value: command.description || 'Tidak ada deskripsi',
                    inline: true
                });
            });

            embed.setFooter({
                text: `Prefix: ${config.prefix} • Total Commands: ${commands.length}`,
                iconURL: client.user.displayAvatarURL()
            })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error in help command:', error);
            await message.reply('❌ Gagal menampilkan daftar command!');
        }
    }
};
