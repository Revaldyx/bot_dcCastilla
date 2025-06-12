# Discord Bot Castilla

Bot Discord khusus untuk server Castilla dengan fitur embed message yang dapat menangani pesan panjang dan struktur organisasi.

## 🌟 Fitur

- **Embed Messages**: Mengirim pesan dengan format embed yang menarik
- **Long Text Support**: Otomatis memecah teks panjang menjadi beberapa embed
- **Command System**: Sistem command yang mudah diperluas
- **Permission Checking**: Validasi permission bot secara otomatis
- **Error Handling**: Penanganan error yang komprehensif
- **Modular Structure**: Struktur kode yang terorganisir dan mudah dikelola

## 📋 Commands

| Command | Deskripsi |
|---------|-----------|
| `!help` | Menampilkan daftar command yang tersedia |
| `!struktur` | Menampilkan struktur organisasi Castilla |
| `!story` | Mengirim story latar belakang gang Castilla |
| `!rulesmafia` | Menampilkan rules mafia Castilla |
| `!checkperms` | Mengecek permission bot di channel saat ini |

## 🛠️ Instalasi

### Prerequisites

- Node.js versi 16.0.0 atau lebih baru
- NPM atau Yarn package manager
- Discord Bot Token

### Langkah Instalasi

1. **Clone atau download project ini**
   ```bash
   git clone <repository-url>
   cd bot_dcCastilla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env` di root directory dan isi dengan:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

4. **Konfigurasi bot**
   
   Edit file `config.json` sesuai kebutuhan:
   ```json
   {
     "prefix": "!",
     "embedColor": "#0099ff",
     "maxEmbedLength": 4096,
     "defaultThumbnail": "your_thumbnail_url"
   }
   ```

5. **Jalankan bot**
   ```bash
   # Production
   npm start
   
   # Development (dengan auto-reload)
   npm run dev
   
   # Test syntax
   npm test
   ```

## 🔧 Konfigurasi

### config.json

| Parameter | Deskripsi | Default |
|-----------|-----------|---------|
| `prefix` | Prefix untuk command bot | `"!"` |
| `embedColor` | Warna default embed | `"#0099ff"` |
| `maxEmbedLength` | Maksimum karakter per embed | `4096` |
| `maxFieldLength` | Maksimum karakter per field | `1024` |
| `maxFields` | Maksimum field per embed | `25` |
| `errorColor` | Warna embed error | `"#ff0000"` |
| `successColor` | Warna embed sukses | `"#00ff00"` |
| `warningColor` | Warna embed warning | `"#ffaa00"` |
| `maxRetries` | Maksimum retry saat error | `3` |
| `retryDelay` | Delay antar retry (ms) | `1000` |
| `defaultThumbnail` | URL thumbnail default | `""` |

## 🏗️ Struktur Project

```
bot_dcCastilla/
├── commands/           # Command files
│   ├── help.js
│   ├── struktur.js
│   ├── story.js
│   ├── rules.js
│   └── checkperms.js
├── utils/              # Utility modules
│   └── embedUtils.js
├── config.json         # Bot configuration
├── package.json        # Dependencies
├── .env               # Environment variables
├── index.js           # Main bot file
└── README.md          # Documentation
```

## 📚 Membuat Command Baru

1. Buat file baru di folder `commands/`
2. Gunakan template berikut:

```javascript
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'commandname',
    description: 'Deskripsi command',
    async execute(message, args, client) {
        // Check permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

        if (!botPermissions.has(requiredPerms)) {
            // Handle missing permissions
            return;
        }

        try {
            // Command logic here
            const embed = new EmbedBuilder()
                .setTitle('Command Title')
                .setDescription('Command content')
                .setColor('#0099ff');

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error in command:', error);
            await message.reply('❌ Terjadi error!');
        }
    }
};
```

3. Bot akan otomatis memuat command baru saat restart

## 🔐 Permissions

Bot memerlukan permissions berikut:

### Required Permissions
- **Send Messages**: Mengirim pesan
- **Embed Links**: Mengirim embed
- **Read Message History**: Membaca history pesan
- **Use External Emojis**: Menggunakan emoji eksternal
- **Add Reactions**: Menambah reaksi

### Recommended Permissions
- **Manage Messages**: Mengelola pesan (untuk moderation)
- **Read Messages**: Membaca pesan di channel

## 🐛 Troubleshooting

### Bot tidak merespon command
1. Cek apakah bot online di server Discord
2. Pastikan prefix sesuai dengan konfigurasi
3. Cek permission bot di channel
4. Lihat console untuk error messages

### Error "Missing Permissions"
1. Gunakan command `!checkperms` untuk mengecek permission
2. Minta admin server untuk memberikan permission yang diperlukan
3. Pastikan bot role berada di atas role target (untuk moderation)

### Embed tidak muncul
1. Pastikan bot memiliki permission "Embed Links"
2. Cek apakah channel memblokir embed
3. Pastikan URL thumbnail/image valid

### Bot offline terus-menerus
1. Cek validitas token di file `.env`
2. Pastikan dependencies terinstall dengan benar
3. Cek console untuk error saat startup

## 📝 Logs

Bot akan menampilkan log berikut:

- `✅ Bot [BotName] telah online!` - Bot berhasil login
- `📊 Loaded X commands` - Jumlah command yang dimuat
- `🔧 Executing command: [command]` - Command sedang dieksekusi
- `❌ Error executing command` - Error saat eksekusi command

## 🤝 Contributing

1. Fork repository ini
2. Buat branch baru untuk fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## 📞 Support

Jika ada pertanyaan atau butuh bantuan:

1. Buat issue di repository ini
2. Contact developer melalui Discord
3. Baca dokumentasi Discord.js: https://discord.js.org/

## 🔄 Changelog

### v1.0.0
- Initial release
- Basic command system
- Embed utilities
- Permission checking
- Error handling

---

**Made with ❤️ for 