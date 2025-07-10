// src/commands/general/deepseek.js
const { askDeepseek } = require('../../utils/aiGroq.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'deepseek',
    category: 'general',
    description: 'Bertanya kepada Groq Deepseek AI.',
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !deepseek.' }, { quoted: msg });
        }

        try {
            const response = await askDeepseek(query);
            await sendBotMessage(msg.key.remoteJid, { text: `*Deepseek:*\n\n${response}` }, { quoted: msg });
        } catch (error) {
            console.error("Error in !deepseek command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};