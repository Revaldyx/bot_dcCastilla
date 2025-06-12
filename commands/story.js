const EmbedUtils = require('../utils/embedUtils');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'story',
    description: 'Mengirim story latar belakang gang Castilla',
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

        const title = '📖 STORY CASTILLA';
        const longText = `
        **Nama Gang     :** Castilla
        **Jenis Gang    :** Business
        **Pilihan Bisnis:** Drugs

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
                message.channel,
                title,
                longText,
                {
                    color: '#8B4513',
                    timestamp: true,
                    thumbnail: 'https://cdn.discordapp.com/attachments/912410701761499166/1382835006837227743/image13.png?ex=684c98f5&is=684b4775&hm=5229c6d1bfa9a524c7dd3285d34eb9338251adf2dd760c804db921f1d6e3142e&'
                }
            );

            if (embedCount > 1) {
                await message.reply(`✅ Berhasil mengirim ${embedCount} embed story!`);
            }
        } catch (error) {
            console.error('Error sending story embed:', error);

            if (error.code === 50013) {
                try {
                    await message.author.send('❌ Bot tidak memiliki permission yang cukup untuk mengirim embed di channel tersebut!');
                } catch (dmError) {
                    console.error('Cannot send DM to user:', dmError);
                }
            } else {
                try {
                    await message.reply('❌ Gagal mengirim story embed!');
                } catch (replyError) {
                    console.error('Cannot reply to message:', replyError);
                }
            }
        }
    }
};
