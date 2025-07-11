// src/commands/general/profile.js (Diperbarui untuk menampilkan statistik game)
const { getUserData } = require('../../utils/leveling.js');
const botMessenger = require('../../utils/botMessenger');

module.exports = {
    name: 'profile',
    category: 'general',
    description: 'Menampilkan profil Anda (Level, XP, Role, Typology, Statistik Game).',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg) => {
        try {
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const userData = getUserData(senderJid);
            const senderName = msg.pushName || 'Pengguna';

            // Hitung Win Rate
            const totalGames = userData.gameStats?.played || 0;
            const gamesWon = userData.gameStats?.won || 0;
            const gamesLost = userData.gameStats?.lost || 0;
            const winRate = totalGames > 0 ? ((gamesWon / totalGames) * 100).toFixed(2) : '0.00';

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
*├───「 🎮 Statistik Game 」───*
│
│ *Total Dimainkan:* ${totalGames}
│ *Menang:* ${gamesWon}
│ *Kalah:* ${gamesLost}
│ *Win Rate:* ${winRate}%
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