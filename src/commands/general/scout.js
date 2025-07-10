// src/commands/general/aiLlamaScout.js
const { askQwen } = require('../../utils/ai.js'); // Menggunakan askQwen karena dipetakan ke llama-4-scout

module.exports = {
    name: 'scout',
    category: 'general',
    description: 'Bertanya kepada Llama-4-Scout AI (via Lunos API).',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !scout.' }, { quoted: msg });
        }

        try {
            const response = await askQwen(query); // Memanggil askQwen
            if (response === null) {
                return sock.sendMessage(msg.key.remoteJid, { text: 'Maaf, Llama-4-Scout AI tidak dapat memberikan respons saat ini.' }, { quoted: msg });
            }
            await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });
        } catch (error) {
            console.error("Error pada perintah !scout:", error.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};