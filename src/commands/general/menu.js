const { getUserData } = require('../../utils/leveling.js');

module.exports = {
    name: 'menu',
    category: 'general',
    description: 'Menampilkan menu perintah bot.',
    execute: async (sock, msg) => {
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
│  • *!gemini <teks>* - Tanya AI Gemini
│  • *!groq <teks>* - Tanya AI Groq
│  • *!qwen <teks>* - Tanya AI Qwen
│  • *!menu* - Tampilkan menu ini
│
*├───「 👑 Perintah Admin 」───*
│
│  • *!tagall [pesan]* - Mention semua anggota
│  • *!broadcast <pesan>* - Kirim pesan ke semua grup
│  • *!on* - Aktifkan bot
│  • *!off* - Nonaktifkan bot
│
*├───「 📱 Ikuti Kami 」───*
│
│ • *Instagram:* @lamaisontypology
│ • *TikTok:* @lamaisontypology
│ • *Situs Web:* lamaisontypology.vercel.app
│
*╰───────────···*
            `;
            await sock.sendMessage(msg.key.remoteJid, { text: menuText }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !menu:", error);
        }
    },
};