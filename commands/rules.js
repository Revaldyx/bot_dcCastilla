const EmbedUtils = require('../utils/embedUtils');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rulesmafia',
    description: 'mengirim rules',
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

        const title = ' ';
        const longText = ` 
        # RULES OF LIFE MAFIA 🇫🇷 💎
        
        - Selalu dibaca [City Rules](https://discord.com/channels/1222792501837172767/1222795098731974656) dan [Criminal Rules](https://discord.com/channels/1222792501837172767/1224030757085774028) (*Punishment disiksa sampai mati*)
        - Ingat karena kita mafia yang bekerja underground. jangan terlalu blak-blakan informasi tentang keluarga dan kelompok. (*Punishment Tembak Kaki*)
        - Segala keputusan yang keluar dari **BOSS** baik Ucapan/Tulisan wajib ikuti dan dilaksanakan. (*Punishment Sayat Tangan*)
        - Untuk **GODMOTHER** dilarang untuk terlalu banyak berkenalan dengan cowok demi rahasia keluarga dan kelompok. (*Punishment Digantung*)
        - Minimal dalam 1 Minggu 3x Ikut kegiatan. **Yang tidak ada izin/tidak mau dipersilakan meninggalkan kelompok ini.** (*Punishment Kick/Demoted dari kelompok*)
        - Dilarang membawa masalah IRL (OOC/Out Off Character) ke dalam roleplay (IC/In Character) maupun sebaliknya. (*Punishment Didepak dari kelompok*)
        - Tidak boleh mengkhianati keluarga dan menjadi mata-mata dengan alasan apapun.(*Punishment Dihilangkan secara permanen*)
        - Wajib menjaga kehormatan keluarga kapanpun dan dimanapun. (*Punishment Dicopot dari jabatan lalu diinterogasi*)
        - Dilarang membuat keputusan besar tanpa izin **BOSS/GODMOTHER**. (*Punishment Dihukum di depan keluarga*)
        - Barang hasil rampokan, sitaan dan resources kelompok harus dilaporkan ke **ADVISOR**. (*Punishment Disita + Interogasi*)
        - Setiap anggota wajib hafal kode, lokasi aman, dan nama-nama penting dalam keluarga. (*Punishment Latihan ulang + Hinaan publik*)
        - Dilarang keras membuat perjanjian dengan geng lain tanpa restu **Petinggi/Commander**. (*Punishment Diculik + Diadili internal*)
        - Hormati sesama anggota, apapun jabatannya. (*Punishment Ditegur + Tugas berat*)
        - Dilarang keras **KORUPSI** dalam bentuk, situasi dan alasan apapun. (*Punishment Dihilangkan secara permanen*)
        - Ketika Aktivitas di kota Moxie wajib hukumnya mengganti nama passport (Username Fivem) dengan format **"Castilla - [Nama Karakter]"** (*Punishment Ditegur + Tidak boleh ikut kegiatan sampai ganti nama*)

        Note : Bila ada yang ingin ditanyakan silahkan DM **BOSS** atau **COMMANDER** atau Chat di [「💌」𝗖𝗵𝗮𝘁-𝗖𝗮𝘀𝘁𝗶𝗹𝗹𝗮-𝗠𝗼𝘅𝗶𝗲](https://discord.com/channels/1220021811325042768/1381949017780518995). Segala tambahan/perubahan akan di update di rules ini.
        `.trim();

        try {
            const embedCount = await EmbedUtils.sendLongEmbed(
                message.channel,
                title,
                longText,
                {
                    color: '#00ff00',
                    timestamp: true,
                }
            );

            if (embedCount > 1) {
                await message.reply(`✅ Berhasil mengirim ${embedCount} embed!`);
            }
        } catch (error) {
            console.error('Error sending long embed:', error);

            // Try to send a simple text message as fallback
            if (error.code === 50013) {
                try {
                    await message.author.send('❌ Bot tidak memiliki permission yang cukup untuk mengirim embed di channel tersebut!');
                } catch (dmError) {
                    console.error('Cannot send DM to user:', dmError);
                }
            } else {
                try {
                    await message.reply('❌ Gagal mengirim embed panjang!');
                } catch (replyError) {
                    console.error('Cannot reply to message:', replyError);
                }
            }
        }
    }
};
