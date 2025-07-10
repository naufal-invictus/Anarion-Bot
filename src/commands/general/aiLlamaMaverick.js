const { askLlamaMaverick } = require('../../utils/ai.js');

module.exports = {
    name: 'maverick', // You can choose a different command name if desired
    category: 'general',
    description: 'Bertanya kepada Llama-4-Maverick AI (via Lunos API).',
        access: { // <<< Tambahkan ini
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !llamamav.' }, { quoted: msg });
        }

        try {
            const response = await askLlamaMaverick(query);
            await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });
        } catch (error) {
            console.error("Error pada perintah !llamamav:", error.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};