// src/commands/game/surrenderGame.js
const { surrenderGame } = require('../../utils/gameManager');
const { sendBotMessage } = require('../../utils/botMessenger');

module.exports = {
    name: 'nyerah',
    category: 'game',
    description: 'Mengakhiri game yang sedang berjalan di grup ini.',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const groupJid = msg.key.remoteJid;
        const playerJid = msg.key.participant || msg.key.remoteJid;

        // Pastikan perintah hanya bisa digunakan di grup
        if (!groupJid.endsWith('@g.us')) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Perintah ini hanya bisa digunakan di grup.' }, { quoted: msg });
        }

        try {
            await surrenderGame(groupJid, playerJid);
        } catch (error) {
            console.error("Error surrendering game:", error);
            await sendBotMessage(groupJid, { text: 'Gagal menyerah dari game. Terjadi kesalahan internal.' }, { quoted: msg });
        }
    },
};