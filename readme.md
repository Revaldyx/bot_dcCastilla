# Discord Bot Castilla

Bot Discord untuk server Castilla dengan sistem manajemen struktur organisasi, sticky messages, dan fitur administrasi untuk roleplay mafia.

## 🚀 Fitur Utama

- **Struktur Organisasi**: Manajemen hierarki organisasi dengan ID member 4 digit acak.
- **Sticky Messages**: Pesan yang selalu muncul di atas channel (embed & plain, support gambar).
- **Slash Commands**: Command modern dengan autocomplete & validasi parameter.
- **Story & Rules**: Sistem story latar belakang & rules mafia.
- **Role Integration**: Otomatis update role Discord saat add/move/remove member.
- **Permission System**: Validasi permission otomatis, role-based & owner override.
- **Auto Features**: Validasi startup, protection system, error recovery.

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
| `/ms cekrolestruktur` | Sinkronisasi role Discord sesuai struktur | Commander+ |
| `/story` | Kirim story latar belakang Castilla | Anyone |
| `/rulesmafia` | Tampilkan rules mafia | Anyone |
| `/purge` | Hapus sejumlah pesan | Manage Messages |
| `/help` | Daftar command yang tersedia | Anyone |
| `/checkperms` | Cek permission bot di channel | Anyone |

**Catatan:**
- Semua notifikasi `/ms` hanya pesan status singkat (tanpa embed/member detail).
- Dev (`403174107904081933`) selalu bisa menjalankan semua slash command tanpa batasan permission.
- ID member pada struktur organisasi selalu 4 angka acak.

## 🔧 Traditional Commands

| Command | Deskripsi | Permission |
|---------|-----------|------------|
| `!sticky embed <judul>|<deskripsi>|[image_url]|[color]` | Sticky embed dengan gambar | Manage Messages |
| `!sticky plain <pesan> [image_url]` | Sticky text dengan gambar | Manage Messages |
| `!sticky remove` | Hapus sticky message | Manage Messages |
| `!sticky status` | Status sticky di channel | Manage Messages |
| `!sticky protect [on|off]` | Toggle protection sticky | Manage Messages |

## 🏗️ Struktur Organisasi Castilla

### Hierarki Posisi

1. **👑 Le Patron (Boss)** - 1 slot
2. **🎯 Le Conseiller (Advisor)** - 5 slot
3. **⚔️ Les Capitaines (Captains)** - 5 slot
4. **💼 Les Brokers (Brokers)** - 35 slot
5. **🤝 Les Recrues (Recruit)** - 50 slot

**Catatan:**  
- Semua label "Brokers" sudah digunakan di seluruh tampilan dan struktur.
- ID member pada setiap posisi selalu 4 angka acak.

### Fitur Manajemen Struktur

- **Auto ID Generation**: ID unik otomatis 4 angka untuk setiap member.
- **Role Integration**: Otomatis tambah/hapus role Discord saat add/move/remove.
- **Search System**: Pencarian member dengan nama atau ID.
- **Statistics**: Statistik real-time kapasitas & pengisian.
- **Move System**: Pemindahan member antar posisi (role Discord juga otomatis diubah).
- **Data Persistence**: Penyimpanan data permanen.

## 🛠️ Instalasi

### Prasyarat

- Node.js v16+
- NPM/Yarn
- Discord Bot Token

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
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```
4. **Deploy slash commands**
   ```bash
   npm run deploy
   ```
5. **Jalankan bot**
   ```bash
   npm start
   ```

## 🔧 Konfigurasi

Lihat `config.json` untuk pengaturan warna, prefix, sticky delay, dsb.

## 📌 Sticky Messages

- **Format**: Embed & plain text
- **Image Support**: URL direct, Discord CDN, Imgur, GitHub
- **Auto Recreation**: Sticky muncul kembali otomatis
- **Protection System**: Sticky dilindungi dari penghapusan
- **Error Recovery**: Retry otomatis jika gagal

## 🔐 Permission System

- **Role-based**: Hanya Commander+ yang bisa kelola struktur
- **Owner override**: Dev selalu bisa akses semua command
- **Permission check**: Otomatis validasi permission sebelum eksekusi

## 🏗️ Struktur Project

```
bot_dcCastilla/
├── slash-commands/
├── commands/
├── utils/
├── data/
├── config.json
├── package.json
├── .env
├── index.js
├── deploy-commands.js
└── README.md
```

## 📝 Changelog

### v3.2.0 (Terbaru)
- **CHANGE**: Semua notifikasi `/ms` hanya pesan status singkat (tanpa embed/member detail)
- **CHANGE**: Dev selalu bisa akses semua slash command tanpa batasan permission
- **IMPROVED**: Otomatis update role Discord saat member dipindah/ditambah/dihapus
- **FIXED**: Perbaikan bug role tidak terhapus/terupdate saat move/remove
- **UPDATE**: Struktur organisasi dan sticky system lebih stabil

---

*Bot ini dikembangkan khusus untuk kebutuhan roleplay mafia server Discord Castilla.*