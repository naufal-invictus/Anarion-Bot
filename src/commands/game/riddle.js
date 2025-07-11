// src/commands/game/startRiddle.js
const { startGame } = require('../../utils/gameManager');
const { sendBotMessage } = require('../../utils/botMessenger');

module.exports = {
    name: 'riddle',
    category: 'game',
    description: 'Memulai game tebak riddle.',
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
            return sendBotMessage(msg.key.remoteJid, { text: 'Game ini hanya bisa dimainkan di grup.' }, { quoted: msg });
        }

        try {
            await startGame(sock, groupJid, playerJid, 'riddle');
        } catch (error) {
            console.error("Error starting riddle game:", error);
            await sendBotMessage(groupJid, { text: 'Gagal memulai game riddle. Terjadi kesalahan internal.' }, { quoted: msg });
        }
    },
};