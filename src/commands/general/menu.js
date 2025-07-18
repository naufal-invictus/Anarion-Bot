// src/commands/general/menu.js
const { getUserData } = require('../../utils/leveling.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Pastikan ini ada

module.exports = {
    name: 'menu',
    category: 'general',
    description: 'Menampilkan menu perintah bot.',
   access: { // <<< Tambahkan ini. Menu harus tersedia di semua kategori.
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg) => { // 'sookck' tetap di sini untuk argumen lain
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const userData = getUserData(senderJid);

            const menuText = `
*╭───「 🤖 Pelayan Grup 」───*
│
│ *👤 Profil Anda:*
│   • Nickname: ${userData.nickname || 'Belum diatur'}
│   • Level: ${userData.level} (XP: ${userData.xp})
│   • Role: ${userData.roles.length > 0 ? userData.roles.join(', ') : 'Tidak ada'}
│   • Typology: ${userData.personality || 'Belum diatur'}
│
*├───「 📜 Perintah Umum 」───*
│
│  • *!profile* - Lihat profil Anda
│  • *!menu* - Tampilkan menu ini
│  • *!fakta* - Dapatkan fakta
│  • *!roast <tipe_kepribadian>* - Roast kepribadian dengan kejam
│  • *!setnick <nickname>* - Atur nickname Anda
│  • *!settypo <tipe_typology>* - Atur tipe typology Anda
│  • *!setrole <nama_peran>* - Atur peran Anda
│  • *!listroles* - Lihat daftar peran tersedia
│  • *!mp3 <url_sosmed>* - Unduh audio MP3
│  • *!mp4 <url_sosmed>* - Unduh video MP4
│  • *!spotify <url_lagu>* - Unduh lagu Spotify
│  • *!tiktok <url_tiktok>* - Unduh video/gambar/musik TikTok
│
*├───「 🎮 Perintah Game 」───*
│
│  • *!riddle* - Mulai tebak riddle
│  • *!matematika* - Mulai kuis matematika
│  • *!sejarah* - Mulai kuis sejarah
│  • *!logika* - Mulai kuis logika
│  • *!trivia* - Mulai kuis trivia
│  •    *!jawab <jawaban>* - Jawab pertanyaan game
│  •    *!nyerah* - Menyerah dari game
│  

*├───「 🧠 Perintah AI 」───*
│
│  • *!gemini <teks>* - Tanya AI Gemini
│  • *!groq <teks>* - Tanya AI Groq
│  • *!qwen <teks>* - Tanya AI Qwen 
│  • *!gpt4 <teks>* - Tanya AI GPT-4 
│  • *!qwenturbo <teks>* - Tanya AI Qwen Turbo
│  • *!qwen3 <teks>* - Tanya AI Qwen 3
│  • *!scout <teks>* - Tanya AI Scout
│  • *!qwen-max <teks>* - Tanya AI Qwen Max
│  • *!llama <teks>* - Tanya AI Llama 
│  • *!deepseek <teks>* - Tanya AI Deepseek 
│  • *!gemma <teks>* - Tanya AI Gemma
│
*├───「 ⬇️ Perintah Downloader 」───*
│
│  • *!mp3 <url_sosmed>* - Unduh audio MP3
│  • *!mp4 <url_sosmed>* - Unduh video MP4
│  • *!spotify <url_lagu>* - Unduh lagu Spotify
│  • *!tiktok <url_tiktok>* - Unduh video/gambar/musik TikTok
│
*├───「 👑 Perintah Admin 」───*
│
│  • *!tagall [pesan]* - Mention semua anggota
│  • *!broadcast <pesan>* - Kirim pesan ke semua grup
│  • *!on* - Aktifkan bot
│  • *!off* - Nonaktifkan bot
│  • *!addadmin <tag_user>* - Tambah admin
│  • *!report <day|week|month|all>* - Laporan aktivitas
│  • *!restart* - Restart bot
│  • *!shutdown* - Matikan bot
│  • *!rpon* - Aktifkan mode roleplay (per grup)
│  • *!rpoff* - Nonaktifkan mode roleplay (per grup)
│  
*├───「 📱 Ikuti Kami 」───*
│
│ • *Instagram:* @lamaisontypology
│ • *TikTok:* @lamaisontypology
│ • *Situs Web:* lamaisontypology.vercel.app
│
*╰───────────···*
            `;
            // Cukup panggil sendBotMessage tanpa 'sock' sebagai argumen pertama
            await sendBotMessage(msg.key.remoteJid, { text: menuText }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !menu:", error);
            // Pesan error ke pengguna tetap menggunakan sendBotMessage
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !menu.` }, { quoted: msg });
        }
    },
};