// src/commands/general/qwenMax.js
const { askQwenMax } = require('../../utils/aiAlibaba.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'qwen-max',
    category: 'general',
    description: 'Bertanya kepada Alibaba Qwen Max AI.',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !qwen-max.' }, { quoted: msg });
        }

        try {
            const response = await askQwenMax(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*Qwen Max:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !qwen-max command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};