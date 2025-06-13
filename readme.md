# Discord Bot Castilla

Bot Discord khusus untuk server Castilla dengan fitur lengkap termasuk sticky messages dengan dukungan gambar, embed messages, dan sistem manajemen channel.

## 🌟 Fitur Utama

- **Sticky Messages dengan Gambar**: Sistem pesan yang selalu muncul di atas channel dengan dukungan gambar
- **Embed Messages**: Mengirim pesan dengan format embed yang menarik
- **Long Text Support**: Otomatis memecah teks panjang menjadi beberapa embed
- **Message Management**: Command untuk menghapus pesan dengan perlindungan sticky
- **Command System**: Sistem command yang mudah diperluas
- **Permission Checking**: Validasi permission bot secara otomatis
- **Error Handling**: Penanganan error yang komprehensif
- **Modular Structure**: Struktur kode yang terorganisir dan mudah dikelola

## 📋 Commands

| Command | Deskripsi | Permission |
|---------|-----------|------------|
| `!helpboscastilla` | Menampilkan daftar command yang tersedia | - |
| `!struktur` | Menampilkan struktur organisasi Castilla | - |
| `!story` | Mengirim story latar belakang gang Castilla | - |
| `!rulesmafia` | Menampilkan rules mafia Castilla | - |
| `!checkperms` | Mengecek permission bot di channel saat ini | - |
| `!sticky embed <message> [image_url]` | Membuat sticky message dengan format embed dan gambar opsional | Manage Messages |
| `!sticky text <message> [image_url]` | Membuat sticky message dengan format teks biasa dan gambar opsional | Manage Messages |
| `!sticky remove` | Menghapus sticky message dari channel | Manage Messages |
| `!sticky status` | Melihat status sticky message di channel | Manage Messages |
| `!hapus <jumlah>` | Menghapus sejumlah pesan terakhir (1-100) | Manage Messages |
| `!hapus all` | Menghapus semua pesan di channel (dengan konfirmasi) | Manage Messages |

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
     "protectStickyMessages": true
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
| `maxStickyLength` | Maksimum karakter sticky message | `2000` |
| `protectStickyMessages` | Aktifkan perlindungan sticky message | `true` |
| `stickyProtectionWarning` | Pesan peringatan saat sticky dihapus | `"⚠️ Pesan sticky..."` |

## 🏗️ Struktur Project

```
bot_dcCastilla/
├── commands/           # Command files
│   ├── help.js        # Help command
│   ├── struktur.js    # Organization structure
│   ├── story.js       # Gang background story
│   ├── rules.js       # Mafia rules
│   ├── sticky.js      # Sticky message management
│   ├── clear.js       # Message deletion
│   └── checkperms.js  # Permission checker
├── utils/              # Utility modules
│   ├── embedUtils.js  # Embed utilities
│   └── stickyManager.js # Sticky message manager
├── data/               # Data storage
│   └── sticky.json    # Sticky messages data
├── config.json         # Bot configuration
├── package.json        # Dependencies
├── .env               # Environment variables
├── index.js           # Main bot file
└── README.md          # Documentation
```

## 📌 Sticky Messages

### Fitur Sticky Messages

- **Auto-recreation**: Sticky message otomatis muncul kembali setelah ada pesan baru
- **Protection**: Sticky message dilindungi dari penghapusan manual
- **Format Support**: Mendukung format embed dan plain text
- **Image Support**: Mendukung gambar melalui URL atau upload attachment
- **Persistence**: Data sticky tersimpan dan bertahan setelah bot restart

### Cara Menggunakan

```bash
# Membuat sticky message dengan format embed
!sticky embed Selamat datang di channel ini!

# Membuat sticky message dengan format embed dan gambar
!sticky embed Selamat datang! https://example.com/welcome.png

# Membuat sticky message dengan format teks biasa
!sticky text ```
Format aplikasi:
Nama: [Nama IC]
Steam Hex: [Steam Hex]
```

# Upload gambar dan buat sticky text bersamaan
# (Upload file gambar, lalu ketik command)
!sticky text Gunakan format ini untuk aplikasi

# Melihat status sticky message
!sticky status

# Menghapus sticky message
!sticky remove
```

### Dukungan Gambar

Sticky messages mendukung gambar dengan cara:

1. **URL Gambar**: Masukkan URL gambar langsung dalam command
   ```bash
   !sticky embed Welcome message! https://cdn.example.com/image.png
   ```

2. **Upload Attachment**: Upload gambar bersamaan dengan mengetik command
   - Drag & drop gambar ke Discord
   - Ketik command sticky dalam kolom pesan yang sama
   - Kirim pesan

3. **Format yang Didukung**: JPG, JPEG, PNG, GIF, WEBP

4. **Validasi Otomatis**: Bot akan memvalidasi URL gambar dan menangani error jika gambar tidak valid

## 🗑️ Message Management

### Clear Command

Command `!hapus` memungkinkan penghapusan pesan dengan fitur:

- **Batch Deletion**: Hapus hingga 100 pesan sekaligus
- **Bulk Delete**: Hapus semua pesan dengan konfirmasi
- **Sticky Protection**: Sticky message tidak ikut terhapus
- **Age Handling**: Otomatis menangani pesan lama (>14 hari)

```bash
# Hapus 10 pesan terakhir
!hapus 10

# Hapus semua pesan (perlu konfirmasi)
!hapus all
```

## 📚 Membuat Command Baru

1. Buat file baru di folder `commands/`
2. Gunakan template berikut:

```javascript
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'commandname',
    description: 'Deskripsi command',
    async execute(message, args, client) {
        // Check permissions
        const botPermissions = message.channel.permissionsFor(message.guild.members.me);
        const requiredPerms = [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks];

        if (!botPermissions.has(requiredPerms)) {
            return message.reply('❌ Bot tidak memiliki permission yang diperlukan!');
        }

        try {
            // Command logic here
            const embed = new EmbedBuilder()
                .setTitle('Command Title')
                .setDescription('Command content')
                .setColor(config.embedColor);

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

### Administrative Permissions
- **Manage Messages**: Mengelola pesan (untuk sticky dan clear commands)

## 🔧 Utilities

### EmbedUtils

Utility class untuk menangani embed dengan fitur:
- **Long Text Splitting**: Otomatis memecah teks panjang
- **Permission Checking**: Validasi permission sebelum mengirim
- **Field Management**: Mengelola field embed dengan pagination
- **Error Handling**: Retry logic untuk mengatasi rate limits

### StickyManager

Manager class untuk sticky messages dengan fitur:
- **Data Persistence**: Menyimpan data sticky ke JSON
- **Message Recreation**: Otomatis membuat ulang sticky yang dihapus
- **Integrity Validation**: Validasi dan perbaikan data sticky saat startup
- **Bulk Operations**: Menangani penghapusan massal

## 🐛 Troubleshooting

### Bot tidak merespon command
1. Cek apakah bot online di server Discord
2. Pastikan prefix sesuai dengan konfigurasi (`!`)
3. Cek permission bot di channel dengan `!checkperms`
4. Lihat console untuk error messages

### Sticky message tidak bekerja
1. Pastikan bot memiliki permission "Manage Messages"
2. Cek file `data/sticky.json` apakah ada data corrupt
3. Restart bot untuk memvalidasi ulang sticky data
4. Gunakan `!sticky status` untuk cek status

### Error "Missing Permissions"
1. Gunakan command `!checkperms` untuk mengecek permission
2. Minta admin server untuk memberikan permission yang diperlukan
3. Pastikan bot role berada di atas role target (untuk moderation)

### Clear command tidak bekerja
1. Pastikan user memiliki permission "Manage Messages"
2. Pastikan bot memiliki permission "Manage Messages" dan "Read Message History"
3. Discord hanya bisa hapus pesan bulk yang umurnya <14 hari

## 📊 Data Storage

Bot menggunakan sistem penyimpanan file JSON:

- `data/sticky.json`: Menyimpan data sticky messages per channel
- Auto-backup saat startup
- Validasi integrity saat bot restart
- Cleanup otomatis untuk channel yang tidak ada

## 📝 Logs

Bot akan menampilkan log berikut:

- `✅ Bot [BotName] telah online!` - Bot berhasil login
- `📊 Loaded X commands` - Jumlah command yang dimuat
- `🔧 Executing command: [command]` - Command sedang dieksekusi
- `🛡️ Sticky message deleted, recreating...` - Sticky message dilindungi
- `✅ Sticky data integrity validated` - Validasi data sticky berhasil

## 🔄 Auto Features

### Startup Validation
- Validasi sticky message integrity
- Recreate sticky messages yang hilang
- Cleanup data untuk channel yang tidak ada

### Runtime Protection
- Melindungi sticky message dari penghapusan
- Auto-recreation saat sticky dihapus
- Handling bulk deletion

## 🤝 Contributing

1. Fork repository ini
2. Buat branch baru untuk fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Guidelines

- Gunakan JSDoc untuk dokumentasi function
- Implementasikan error handling yang proper
- Test semua fitur sebelum commit
- Update README jika menambah fitur baru

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

### v1.1.0
- Added sticky message system
- Added message management (clear command)
- Added sticky message protection
- Improved error handling
- Added data persistence

### v1.2.0
- Enhanced sticky message manager
- Added bulk deletion handling
- Improved permission checking
- Added startup validation
- Better modular structure

### v1.3.0
- **NEW**: Added image support for sticky messages
- Support for URL images and file attachments
- Image validation and error handling
- Enhanced sticky status display with image preview
- Updated documentation and examples

---

**Made with ❤️ for Castilla Discord Server**