// src/commands/general/gemma.js
const { askGemma } = require('../../utils/aiGroq.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'gemma',
    category: 'general',
    description: 'Bertanya kepada Groq Gemma AI.',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !gemma.' }, { quoted: msg });
        }

        try {
            const response = await askGemma(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*Gemma:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !gemma command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};