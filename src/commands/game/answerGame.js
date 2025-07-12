// src/commands/game/j.js
const { processAnswer } = require('../../utils/gameManager');
const { sendBotMessage } = require('../../utils/botMessenger');

module.exports = {
    name: 'jawab', // Nama perintah baru
    category: 'game',
    description: 'Menjawab pertanyaan game yang sedang berjalan.',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const groupJid = msg.key.remoteJid;
        const playerJid = msg.key.participant || msg.key.remoteJid;
        const userAnswer = args.join(' ').trim();

        if (!userAnswer) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan jawaban Anda. Contoh: `!jawab`' }, { quoted: msg });
        }

        // Pastikan perintah hanya bisa digunakan di grup
        if (!groupJid.endsWith('@g.us')) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Anda hanya bisa menjawab game di grup.' }, { quoted: msg });
        }

        try {
            await processAnswer(groupJid, playerJid, userAnswer);
        } catch (error) {
            console.error("Error processing game answer:", error);
            await sendBotMessage(groupJid, { text: 'Gagal memproses jawaban. Terjadi kesalahan internal.' }, { quoted: msg });
        }
    },
};