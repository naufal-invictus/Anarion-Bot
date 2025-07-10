// src/commands/general/gpt4.js
const { askGpt4FromMaelyn } = require('../../utils/aiMaelyn.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'gpt4',
    category: 'general',
    description: 'Bertanya kepada GPT-4 AI melalui Maelyn API.',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteRijid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !gpt4.' }, { quoted: msg });
        }

        try {
            const response = await askGpt4FromMaelyn(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*GPT-4:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !gpt4 command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};