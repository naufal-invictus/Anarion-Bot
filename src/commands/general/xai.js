const { askGroq } = require('../../utils/ai.js');

module.exports = {
    name: 'xai',
    category: 'general',
    description: 'Bertanya kepada Groq AI (via Lunos API).',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !groq.' }, { quoted: msg });
        }

        try {
            const response = await askGroq(query);
            await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });
        } catch (error) {
            console.error("Error pada perintah !groq:", error.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};