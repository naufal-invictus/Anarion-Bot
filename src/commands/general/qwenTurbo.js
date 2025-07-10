// src/commands/general/qwenTurbo.js
const { askQwenTurbo } = require('../../utils/aiAlibaba.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'qwenturbo',
    category: 'general',
    description: 'Bertanya kepada Alibaba Qwen Turbo AI.',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !qwenturbo.' }, { quoted: msg });
        }

        try {
            const response = await askQwenTurbo(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*Qwen Turbo:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !qwenturbo command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};