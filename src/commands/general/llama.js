// src/commands/general/llama.js
const { askLlama } = require('../../utils/aiGroq.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'llama',
    category: 'general',
    description: 'Bertanya kepada Groq LLAMA AI.',
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !llama.' }, { quoted: msg });
        }

        try {
            const response = await askLlama(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*LLAMA:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !llama command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};