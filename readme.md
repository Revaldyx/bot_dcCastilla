# Discord Bot Castilla

Bot Discord untuk server Castilla dengan sistem manajemen struktur organisasi, sticky messages, dan fitur administrasi untuk roleplay mafia.

## 🚀 Fitur Utama

- **Struktur Organisasi**: Manajemen hierarki organisasi dengan ID member 4 digit acak.
- **Sticky Messages**: Pesan yang selalu muncul di atas channel (embed & plain, support gambar).
- **Slash Commands**: Command modern dengan autocomplete & validasi parameter.
- **Story & Rules**: Sistem story latar belakang & rules mafia.
- **Role Integration**: Otomatis update role Discord saat add/move/remove member.
- **Streaming & LIVE**: 
  - Auto-assign role "NOW STREAMING" (default: "🔴 LIVE NOW") saat member live, hapus saat berhenti.
  - Auto-create role jika belum ada (opsional).
  - Deteksi native streaming (ActivityType.Streaming) dan link live di Custom Status (TikTok/Kick/FB/Trovo/Bilibili).
  - Pengumuman LIVE otomatis ke channel yang ditentukan.
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
- Fitur streaming/LIVE berjalan otomatis berdasarkan presence (tidak memerlukan slash command khusus).

## 🎥 Streaming & Live Announcement

Fitur ini mengelola role "NOW STREAMING" dan mengirim pengumuman LIVE otomatis:
- Deteksi streaming:
  - Native: ActivityType.Streaming (Twitch/YouTube/Go Live) dengan URL.
  - Custom Status: Link live yang tercantum di status kustom sesuai domain whitelist (mis. tiktok.com, kick.com, fb.gg, trovo.live, live.bilibili.com).
- Role:
  - Tambah role saat mulai live, hapus saat berhenti (opsional).
  - Bisa auto-create role jika belum ada (dengan Manage Roles).
- Pengumuman:
  - Kirim pesan ke channel yang ditentukan saat mulai live.
  - Opsi hapus pesan saat live berakhir.

Catatan permission:
- Bot membutuhkan Manage Roles untuk kelola role streaming.
- Bot butuh Send Messages di channel pengumuman.
- Aktifkan Gateway Intents: Guilds, GuildMembers, GuildMessages, MessageContent, GuildPresences.

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
- Aktifkan Gateway Intents di Developer Portal:
  - SERVER MEMBERS INTENT (Guild Members)
  - PRESENCE INTENT (Guild Presences)
  - MESSAGE CONTENT INTENT (Message Content)
- Undang bot dengan permission minimal:
  - Send Messages, Read Messages/View Channels
  - Manage Roles (untuk fitur streaming role)
  - Manage Messages (untuk sticky message dan administrasi)

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

Tambahan konfigurasi untuk fitur streaming/LIVE:
```json
{
  "streamingRole": {
    "enabled": true,
    "roleId": "1401310721446379681",
    "roleName": "🔴 LIVE NOW",
    "roleColor": "#593695",
    "autoCreateIfMissing": true,
    "removeOnStop": true,
    "requireStreamingUrl": true
  },
  "liveAnnouncements": {
    "enabled": true,
    "channelId": "1312768414640766976",
    "deleteOnStop": false
  },
  "streamingDetect": {
    "customStatusLinks": {
      "enabled": true,
      "domains": [
        "tiktok.com",
        "kick.com",
        "fb.gg",
        "facebook.com",
        "trovo.live",
        "live.bilibili.com"
      ]
    }
  }
}
```

- streamingRole:
  - roleId/roleName: identitas role streaming (gunakan salah satu; bot akan cari by ID dulu).
  - autoCreateIfMissing: buat role otomatis jika belum ada.
  - removeOnStop: hapus role saat live berhenti.
  - requireStreamingUrl: hanya anggap streaming jika ada URL (untuk ActivityType.Streaming).
- liveAnnouncements:
  - channelId: channel tujuan pengumuman LIVE.
  - deleteOnStop: hapus pesan pengumuman saat live berakhir.
- streamingDetect.customStatusLinks:
  - enabled: aktifkan deteksi link live dari Custom Status.
  - domains: whitelist domain yang dianggap live.

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

### v3.3.0
- NEW: NOW STREAMING role otomatis (auto-create, add/remove saat live start/stop).
- NEW: Pengumuman LIVE otomatis ke channel terpilih.
- NEW: Deteksi link live dari Custom Status (domain whitelist).
- DOCS: Update README terkait intents & permission yang dibutuhkan.

### v3.2.0 (Terbaru)
- **CHANGE**: Semua notifikasi `/ms` hanya pesan status singkat (tanpa embed/member detail)
- **CHANGE**: Dev selalu bisa akses semua slash command tanpa batasan permission
- **IMPROVED**: Otomatis update role Discord saat member dipindah/ditambah/dihapus
- **FIXED**: Perbaikan bug role tidak terhapus/terupdate saat move/remove
- **UPDATE**: Struktur organisasi dan sticky system lebih stabil

---