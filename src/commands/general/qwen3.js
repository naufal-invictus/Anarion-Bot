// src/commands/general/qwen3.js
const { askQwen3 } = require('../../utils/aiAlibaba.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'qwen3',
    category: 'general',
    description: 'Bertanya kepada Alibaba Qwen 3 AI.',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !qwen3.' }, { quoted: msg });
        }

        try {
            const response = await askQwen3(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*Qwen 3:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !qwen3 command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};