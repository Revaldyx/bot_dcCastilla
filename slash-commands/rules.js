const { SlashCommandBuilder } = require('discord.js');
const EmbedUtils = require('../utils/embedUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rulesmafia')
        .setDescription('Menampilkan rules mafia Castilla'),

    async execute(interaction) {
        if (interaction.user.id !== '403174107904081933') {
            return interaction.reply({
                content: '❌ Command ini hanya bisa digunakan oleh developer.',
                ephemeral: true
            });
        }
        await interaction.deferReply();

        const title = ' ';
        const longText = ` 
        # RULES OF LIFE MAFIA 🇫🇷 💎
        
        - Selalu dibaca dan dipahami [City Rules](https://discord.com/channels/1222792501837172767/1222795098731974656) dan [Criminal Rules](https://discord.com/channels/1222792501837172767/1224030757085774028) (*Punishment disiksa sampai mati*)
        - Ingat karena kita bergaya Mafia. jangan terlalu blak-blakan informasi tentang keluarga dan kelompok dan Jaga behavior. (*Punishment Tembak Kaki*)
        - Segala keputusan yang keluar dari **BOSS** DAN **COMMANDER** baik Ucapan/Tulisan wajib ikuti dan dilaksanakan. (*Punishment Sayat Tangan*)
        - Untuk **GODMOTHER** dilarang untuk terlalu banyak berkenalan dengan cowok demi rahasia keluarga dan kelompok. (*Punishment Digantung*)
        - Minimal dalam 1 Minggu 3x Ikut kegiatan. **Yang tidak ada izin tertulis di Chat-castilla-moxie/tidak mau ikut aturan ini dipersilakan meninggalkan kelompok ini.** (*Punishment Kick/Demoted dari kelompok*)
        - Dilarang membawa masalah IRL (OOC/Out Off Character) ke dalam roleplay (IC/In Character) maupun sebaliknya. (*Punishment Didepak dari kelompok*)
        - Tidak boleh mengkhianati keluarga dan menjadi mata-mata dengan alasan apapun.(*Punishment Dihilangkan secara permanen*)
        - Wajib menjaga kehormatan keluarga kapanpun dan dimanapun. (*Punishment Dicopot dari jabatan lalu diinterogasi*)
        - Dilarang membuat keputusan besar tanpa izin **BOSS/GODMOTHER**. (*Punishment Dihukum di depan keluarga*)
        - Barang hasil rampokan, sitaan dan resources kelompok harus dilaporkan ke **ADVISOR**. (*Punishment Disita + Interogasi*)
        - Setiap anggota wajib hafal kode, lokasi aman, dan nama-nama penting dalam keluarga. (*Punishment Dipecut*)
        - Dilarang keras membuat perjanjian dengan geng lain tanpa restu **Petinggi/Commander**. (*Punishment Diculik + Diadili internal*)
        - Hormati sesama anggota, apapun jabatannya. (*Punishment Ditegur + Tugas berat*)
        - Dilarang keras **KORUPSI** dalam bentuk, situasi dan alasan apapun. (*Punishment Dihilangkan secara permanen*)
        - Ketika Aktivitas di kota Moxie wajib hukumnya mengganti nama passport (Username Fivem) dengan format **"Castilla - [Nama Karakter]"** (*Punishment Ditegur + Tidak boleh ikut kegiatan sampai ganti nama*)

        Note : Bila ada yang ingin ditanyakan/ditambahkan/diperbaiki silahkan DM **BOSS** atau **COMMANDER** atau Chat di [「💌」𝗖𝗵𝗮𝘁-𝗖𝗮𝘀𝘁𝗶𝗹𝗹𝗮-𝗠𝗼𝘅𝗶𝗲](https://discord.com/channels/1220021811325042768/1381949017780518995). Segala tambahan/perubahan akan terus diupdate di rules ini.
        `.trim();

        try {
            const embedCount = await EmbedUtils.sendLongEmbed(
                interaction.channel,
                title,
                longText,
                {
                    color: '#00ff00',
                    timestamp: true,
                }
            );

            await interaction.editReply(`✅ Berhasil mengirim ${embedCount} embed rules!`);

            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('Error deleting reply:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Error in rules slash command:', error);
            await interaction.editReply('❌ Gagal mengirim rules!');
        }
    }
};
