// src/commands/game/matematika.js
const { startGame } = require('../../utils/gameManager');
const { sendBotMessage } = require('../../utils/botMessenger');

module.exports = {
    name: 'math',
    category: 'game',
    description: 'Memulai game kuis matematika.',
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
            await startGame(sock, groupJid, playerJid, 'matematika');
        } catch (error) {
            console.error("Error starting matematika game:", error);
            await sendBotMessage(groupJid, { text: 'Gagal memulai game matematika. Terjadi kesalahan internal.' }, { quoted: msg });
        }
    },
};