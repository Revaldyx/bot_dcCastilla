# Discord Bot Castilla

Bot Discord khusus untuk server Castilla dengan sistem manajemen struktur organisasi, sticky messages, dan berbagai fitur administrasi untuk roleplay mafia.

## 🌟 Fitur Utama

- **Struktur Organisasi**: Sistem manajemen hierarki lengkap untuk organisasi Castilla
- **Sticky Messages**: Pesan yang selalu muncul di atas channel dengan dukungan embed dan gambar
- **Slash Commands**: Command modern dengan autocomplete dan parameter validation
- **Story & Rules**: Sistem penyampaian latar belakang dan aturan organisasi
- **Message Management**: Sistem penghapusan pesan dengan perlindungan sticky
- **Permission System**: Validasi permission otomatis dengan role-based access
- **Auto Features**: Validasi startup, protection system, dan error recovery

## 📋 Slash Commands

| Command | Deskripsi | Permission |
|---------|-----------|------------|
| `/ms add` | Tambah member ke posisi organisasi | Commander+ |
| `/ms remove` | Hapus member dari posisi | Commander+ |
| `/ms update` | Update data member | Commander+ |
| `/ms move` | Pindah member antar posisi | Commander+ |
| `/ms search` | Cari member dalam struktur | Commander+ |
| `/ms stats` | Statistik struktur organisasi | Commander+ |
| `/ms list` | Daftar member di posisi tertentu | Commander+ |
| `/ms all` | Tampilkan struktur lengkap | Commander+ |
| `/story` | Kirim story latar belakang Castilla | Anyone |
| `/rulesmafia` | Tampilkan rules mafia | Anyone |
| `/purge` | Hapus sejumlah pesan (1-100) | Manage Messages |
| `/help` | Daftar command yang tersedia | Anyone |
| `/checkperms` | Cek permission bot di channel | Anyone |

## 🔧 Traditional Commands

| Command | Deskripsi | Permission |
|---------|-----------|------------|
| `!sticky embed <title>\|<desc>\|[image]\|[color]` | Buat sticky embed dengan gambar | Manage Messages |
| `!sticky plain <message> [image]` | Buat sticky text dengan gambar | Manage Messages |
| `!sticky remove` | Hapus sticky message | Manage Messages |
| `!sticky status` | Status sticky di channel | Manage Messages |
| `!sticky protect [on\|off]` | Toggle protection sticky | Manage Messages |

## 🏗️ Struktur Organisasi Castilla

### Hierarki Posisi

1. **👑 Le Patron (Boss)** - 1 slot
   - Pemimpin tertinggi keluarga Castilla
   - Pengambil keputusan final

2. **💎 La Marraine (Godmother)** - 1 slot
   - Ibu baptis keluarga Castilla
   - Pemegang rahasia utama

3. **🎯 Le Conseiller (Advisor)** - 3 slot
   - Penasihat keluarga Castilla
   - Pemegang pembukuan dan keuangan

4. **⚔️ Les Capitaines (Captains)** - 3 slot
   - Kapten operasional keluarga Castilla
   - Penanggung jawab relasi

5. **💼 Les Courtiers (Brokers)** - 10 slot
   - Perantara bisnis keluarga Castilla
   - Informan dan pengaman

6. **🔫 Les Soldats (Soldier)** - 17 slot
   - Tentara keluarga Castilla
   - Eksekutor lapangan

7. **🤝 Les Recrues (Relasi)** - 50 slot
   - Rekrut dan relasi keluarga Castilla
   - Calon anggota

### Fitur Manajemen Struktur

- **Auto ID Generation**: ID unik otomatis untuk setiap member
- **Role Integration**: Integrasi dengan Discord roles
- **Search System**: Pencarian member dengan nama atau ID
- **Statistics**: Statistik real-time kapasitas dan pengisian
- **Move System**: Pemindahan member antar posisi
- **Data Persistence**: Penyimpanan data permanen dengan backup

## 🛠️ Instalasi

### Prerequisites

- Node.js versi 16.0.0 atau lebih baru
- NPM atau Yarn package manager
- Discord Bot Token dengan permissions yang sesuai

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd bot_dcCastilla
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   
   Buat file `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```

5. **Jalankan bot**
   ```bash
   # Production
   npm start
   
   # Development dengan auto-reload
   npm run dev
   
   # Background (Windows)
   start_bot_invisible.vbs
   ```

## 🔧 Konfigurasi

### config.json

| Parameter | Deskripsi | Default |
|-----------|-----------|---------|
| `prefix` | Prefix untuk traditional commands | `"!"` |
| `embedColor` | Warna default embed | `"#0099ff"` |
| `maxEmbedLength` | Maksimum karakter per embed | `4096` |
| `successColor` | Warna embed sukses | `"#00ff00"` |
| `errorColor` | Warna embed error | `"#ff0000"` |
| `warningColor` | Warna embed warning | `"#ffaa00"` |
| `defaultThumbnail` | URL thumbnail default | Custom Castilla image |
| `stickyDelay` | Delay protection sticky (ms) | `2000` |
| `maxRetries` | Maksimum retry saat error | `3` |
| `commandCooldown` | Cooldown default command (detik) | `3` |
| `allowedImageDomains` | Domain gambar yang diizinkan | Array domains |

## 🏗️ Struktur Project

```
bot_dcCastilla/
├── slash-commands/         # Slash command files
│   ├── manage-struktur.js # Manajemen struktur organisasi
│   ├── story.js          # Story latar belakang
│   ├── rules.js          # Rules mafia
│   ├── purge.js          # Message deletion
│   ├── help.js           # Help command
│   └── checkperms.js     # Permission checker
├── commands/              # Traditional command files
│   └── sticky.js         # Sticky message management
├── utils/                 # Utility modules
│   ├── strukturManager.js # Struktur organization manager
│   ├── stickyManager.js  # Sticky message handler
│   ├── embedUtils.js     # Embed utilities dengan pagination
│   └── fetchPolyfill.js  # Fetch compatibility layer
├── data/                  # Data storage
│   ├── struktur.json     # Organization structure data
│   └── sticky.json       # Sticky messages data
├── config.json           # Bot configuration
├── package.json          # Dependencies dan scripts
├── .env                  # Environment variables
├── index.js              # Main bot file
├── deploy-commands.js    # Slash command deployment
├── start_bot_invisible.vbs # Windows background starter
└── README.md             # Documentation
```

## 📌 Sticky Messages

### Fitur Lengkap

- **Format Support**: Embed dan plain text
- **Image Support**: URL dan file upload
- **Auto Recreation**: Muncul kembali otomatis
- **Protection System**: Dilindungi dari penghapusan
- **Error Recovery**: Handling error dengan retry
- **Data Persistence**: Tersimpan permanen

### Penggunaan Sticky

```bash
# Sticky embed dengan semua parameter
!sticky embed Welcome Message|Selamat datang di channel!|https://example.com/image.png|#ff0000

# Sticky plain text dengan gambar
!sticky plain Format aplikasi:
```
Nama: [Nama IC]
Steam Hex: [Steam Hex]
``` https://example.com/form.png

# Upload file dan buat sticky
# 1. Upload gambar ke Discord
# 2. Ketik command di kolom yang sama
!sticky plain Gunakan format ini untuk aplikasi

# Manajemen sticky
!sticky status    # Lihat status
!sticky protect on # Aktifkan protection
!sticky remove    # Hapus sticky
```
### Dukungan Gambar

- **Format**: JPG, JPEG, PNG, GIF, WEBP, SVG
- **Sumber**: URL direct, Discord CDN, Imgur, GitHub
- **Validasi**: Otomatis validasi URL dan content-type
- **Fallback**: Basic validation jika network test gagal
- **Size Limit**: 8MB maksimum (Discord limit)

## 🔐 Permission System

### Bot Permissions Required

| Permission | Fungsi | Required For |
|------------|--------|--------------|
| Send Messages | Mengirim pesan | All commands |
| Embed Links | Mengirim embed | Most commands |
| Manage Messages | Kelola pesan | Sticky, Purge |
| Read Message History | Baca history | Purge, Message management |
| Use External Emojis | Emoji eksternal | Enhanced messages |
| Add Reactions | Tambah reaksi | Interactive features |

### Role-Based Access

- **Boss/Godmother**: Full access ke semua commands
- **Advisor/Captain**: Access ke management commands
- **Broker/Soldier**: Limited access
- **Recruit**: View-only commands
- **Administrator**: Override semua restrictions

## 🚀 Advanced Features

### Auto Features

- **Startup Validation**: Validasi data integrity saat bot start
- **Sticky Recreation**: Auto-create sticky yang hilang
- **Data Cleanup**: Cleanup data untuk channel yang tidak ada
- **Memory Monitoring**: Monitor penggunaan memory
- **Error Recovery**: Auto-recovery dari berbagai error

### Embed Utils

- **Long Text Splitting**: Otomatis split teks panjang
- **Field Management**: Pagination untuk field embed
- **Permission Checking**: Validasi permission sebelum send
- **Quick Embed**: Template untuk success/error/warning
- **Temporary Messages**: Auto-delete messages

### Error Handling

- **Comprehensive Logging**: Log semua aktivitas dan error
- **Graceful Degradation**: Fallback untuk fitur yang gagal
- **Rate Limit Handling**: Automatic retry dengan delay
- **Permission Error**: Detailed permission error messages
- **Network Error**: Fallback untuk network operations

## 📊 Data Management

### Struktur Data

```json
// struktur.json - Hierarki organisasi
{
  "positions": {
    "boss": {
      "name": "👑 Le Patron (Boss)",
      "members": [...],
      "maxMembers": 1,
      "description": "..."
    }
  },
  "metadata": {
    "lastUpdated": timestamp,
    "version": "1.0.0",
    "totalMembers": number
  }
}

// sticky.json - Sticky messages per channel
{
  "channelId": {
    "messageId": "...",
    "type": "embed|plain",
    "content": "...",
    "image": "url|null",
    "authorId": "...",
    "createdAt": timestamp,
    "lastUpdated": timestamp,
    "protected": boolean,
    "errorCount": number,
    "disabled": boolean
  }
}
```

### Backup & Recovery

- **Auto Backup**: Backup data sebelum modifikasi
- **Integrity Check**: Validasi data saat startup
- **Recovery Mode**: Restore dari backup jika data corrupt
- **Version Migration**: Auto-migrate data structure

## 🎯 Use Cases

### Manajemen Organisasi

```bash
# Tambah member baru
/ms add position:captain name:"Jack Castilla" user:@jack

# Promosi member
/ms move from_position:soldier to_position:broker member_id:sol_john_doe

# Cek statistik
/ms stats

# Lihat struktur lengkap
/ms all
```

### Channel Management

```bash
# Setup sticky informasi
!sticky embed INFO|Jangan lupa beli bandage!||#00ff00

# Setup sticky form aplikasi
!sticky plain Isi form ini:
```
Nama:
Steam Hex:
```
# Cleanup channel
/purge amount:50
```

### Roleplay Features

```bash
# Kirim story background
/story

# Tampilkan rules mafia
/rulesmafia

# Cek permission untuk troubleshooting
/checkperms
```

## 🔧 Development

### Menambah Slash Command

1. Buat file di `slash-commands/`
2. Gunakan template:

```javascript
// filepath: slash-commands/newcommand.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('newcommand')
        .setDescription('Description here')
        .addStringOption(option =>
            option.setName('parameter')
                .setDescription('Parameter description')
                .setRequired(true)),

    async execute(interaction) {
        // Command logic
        await interaction.reply('Response');
    }
};
```
3. Deploy commands: `npm run deploy`

### Menambah Traditional Command

1. Buat file di `commands/`
2. Gunakan template:

```javascript
// filepath: commands/newcommand.js
module.exports = {
    name: 'commandname',
    description: 'Command description',
    async execute(message, args, client) {
        // Command logic
        await message.reply('Response');
    }
};
```

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Bot tidak respond | Permission atau token | Cek `/checkperms` dan .env |
| Slash commands tidak muncul | Belum deploy | Jalankan `npm run deploy` |
| Sticky tidak bekerja | Permission Manage Messages | Berikan permission ke bot |
| Struktur data corrupt | File JSON rusak | Restart bot untuk auto-recovery |
| Memory leak | Long running process | Restart bot secara berkala |

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development npm start

# Test command syntax
npm test

# Check slash command registration
npm run deploy
```

### Performance Monitoring

- Memory usage check setiap 5 menit
- Command execution logging
- Error rate monitoring
- Sticky message recreation tracking

## 📈 Statistics & Monitoring

### Bot Metrics

- Total commands executed
- Error rate per command
- Memory usage trends
- Uptime statistics
- Guild and user count

### Organization Metrics

- Member distribution per position
- Promotion/demotion history
- Activity tracking
- Role compliance

## 🔄 Updates & Maintenance

### Regular Maintenance

- **Data Backup**: Weekly automatic backup
- **Log Rotation**: Monthly log cleanup
- **Performance Review**: Check memory and response times
- **Permission Audit**: Review bot permissions

### Update Process

1. Stop bot gracefully
2. Backup current data
3. Update code/dependencies
4. Test in development
5. Deploy slash commands if needed
6. Restart bot

## 📝 Changelog

### v3.0.0 (Latest)
- **NEW**: Complete structure management system with slash commands
- **NEW**: Advanced autocomplete for member selection
- **NEW**: Role-based permission system
- **NEW**: Enhanced error handling and recovery
- **IMPROVED**: Sticky message system with better image support
- **IMPROVED**: Data persistence and integrity checking
- **IMPROVED**: Performance monitoring and memory management

### v2.1.0
- Added image support for sticky messages
- Enhanced validation and error handling
- Improved documentation and examples
- Better modular structure

### v2.0.0
- Introduced slash commands system
- Added embed utilities with pagination
- Enhanced permission checking
- Improved startup validation

### v1.0.0
- Initial release
- Basic command system
- Sticky message foundation
- Traditional commands only

## 📞 Support

### Getting Help

1. **Documentation**: Baca README lengkap
2. **GitHub Issues**: Report bugs atau request features
3. **Discord Support**: Contact developer di server
4. **Community**: Discord.js documentation dan community

### Contributing

1. Fork repository
2. Create feature branch
3. Make changes dengan proper testing
4. Update documentation
5. Submit pull request

### Guidelines

- Gunakan JSDoc untuk dokumentasi
- Implement comprehensive error handling
- Test semua fitur sebelum commit
- Follow existing code style
- Update README untuk fitur baru

## 📄 License

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lengkap.

## 🏆 Credits

**Made with ❤️ for Castilla Discord Server**

- **Developer**: Bot development team
- **Community**: Castilla server members
- **Inspiration**: Discord.js community dan documentation
- **Special Thanks**: Beta testers dan feedback contributors

---

*Bot ini dikembangkan khusus untuk kebutuhan roleplay mafia server Discord Castilla dengan fitur-fitur yang disesuaikan untuk gameplay dan manajemen komunitas.*