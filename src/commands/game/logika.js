// src/commands/game/logika.js
const { startGame } = require('../../utils/gameManager');
const { sendBotMessage } = require('../../utils/botMessenger');

module.exports = {
    name: 'logika',
    category: 'game',
    description: 'Memulai game kuis logika.',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const groupJid = msg.key.remoteJid;
        const playerJid = msg.key.participant || msg.key.remoteJid;

        if (!groupJid.endsWith('@g.us')) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Game ini hanya bisa dimainkan di grup.' }, { quoted: msg });
        }

        try {
            await startGame(sock, groupJid, playerJid, 'logika');
        } catch (error) {
            console.error("Error starting logika game:", error);
            await sendBotMessage(groupJid, { text: 'Gagal memulai game logika. Terjadi kesalahan internal.' }, { quoted: msg });
        }
    },
};