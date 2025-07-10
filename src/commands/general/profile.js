// src/commands/general/profile.js (Diperbarui)
const { getUserData } = require('../../utils/leveling.js');
const botMessenger = require('../../utils/botMessenger'); // Import botMessenger

module.exports = {
    name: 'profile',
    category: 'general',
    description: 'Menampilkan profil Anda (Level, XP, Role, Typology).',
    access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg) => {
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const userData = getUserData(senderJid);
            const senderName = msg.pushName || 'Pengguna';

            const profileText = `
*╭───「 👤 PROFIL ANDA 」───*
│
│ *Nama:* ${senderName}
│ *Nickname:* ${userData.nickname || 'Belum diatur'}
│ *Role:* ${userData.roles.length > 0 ? userData.roles.join(', ') : 'Tidak ada'}
│ *Typology:* ${userData.personality || 'Belum diatur'}
│ *Level:* ${userData.level}
│ *XP:* ${userData.xp}
│
*╰───────────···*
            `;
            await botMessenger.sendBotMessage(msg.key.remoteJid, {
                text: profileText,
                mentions: [senderJid]
            }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !profile:", error);
            await botMessenger.sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !profile.` }, { quoted: msg });
        }
    },
};