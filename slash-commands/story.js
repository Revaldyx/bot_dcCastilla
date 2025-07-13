const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('story')
        .setDescription('Mengirim story latar belakang gang Castilla'),

    async execute(interaction) {
        if (interaction.user.id !== '403174107904081933') {
            return interaction.reply({
                content: '❌ Command ini hanya bisa digunakan oleh developer.',
                ephemeral: true
            });
        }
        await interaction.deferReply();

        const title = '📖 STORY CASTILLA';
        const longText = `
        **Nama Gang     :** Castilla
        **Jenis Gang    :** Business
        **Pilihan Bisnis:** Gunsmith

        Latar Belakang Gang:

        Di ujung timur Prancis, tersembunyi di balik pegunungan sepi dan kabut pagi yang tak pernah pergi, berdirilah kota kecil bernama Viremont. Di sanalah nama keluarga Castilla dikenal bukan karena kebaikan, tapi karena kekuasaan. Selama bertahun-tahun, keluarga ini membangun dinasti bisnis bayangan—tak tercatat di buku hukum, tapi nyata dalam pengaruh.

        Namun kejayaan tak abadi.

        Satu malam, saat musim gugur mulai menyentuh Viremont, kehancuran datang seperti badai. Sebuah serangan terkoordinasi dari kartel asing meluluhlantakkan bisnis keluarga Castilla. Gudang-gudang mereka dibakar, sekutu-sekutu mereka hilang, dan orang-orang Castilla yang tersisa diburu tanpa ampun. Dalam kekacauan itu, kedua orang tua Valdy menghilang. Tak ada jejak, tak ada pesan. Hanya senyap yang tertinggal.

        Valdyx St. Castilla, anak kelima keluarga itu, selamat. Ia muda, tak dianggap berbahaya, tak pernah terlibat langsung dalam urusan keluarga. Tapi malam itu mengubah segalanya. Rumahnya hancur, darahnya terbelah, dan tanah kelahirannya tak lagi bisa disebut rumah.

        Dalam diam dan duka, Valdy meninggalkan Viremont.

        Dengan hanya membawa nama belakang yang kini lebih menyeramkan daripada dihormati, ia menyeberang batas wilayah dan akhirnya menetap di sebuah kota yang jauh dan asing: Moxie.

        Kota itu keras. Tak bertanya dari mana seseorang berasal, tapi menilai dari bagaimana seseorang bertahan.

        Valdy tak berkata apa-apa tentang masa lalunya.

        Tapi ia tahu, dalam sunyi langkahnya di jalan-jalan Moxie yang berdebu, warisan keluarga Castilla belum benar-benar berakhir.
        `.trim();

        try {
            const embedCount = await EmbedUtils.sendLongEmbed(
                interaction.channel,
                title,
                longText,
                {
                    color: '#8B4513',
                    timestamp: true,
                    thumbnail: 'https://media.discordapp.net/attachments/1393646458624020573/1394055518535946330/final.png?ex=68756adf&is=6874195f&hm=dddaac234dfb341c4c57cca84bd04a738b686ee189d45fd7d350aa0df2489e6c'
                }
            );

            await interaction.editReply(`✅ Berhasil mengirim ${embedCount} embed story!`);

        } catch (error) {
            console.error('Error in story slash command:', error);
            await interaction.editReply('❌ Gagal mengirim story!');
        }
    }
};
