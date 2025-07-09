const { askGemini } = require('../../utils/ai.js');

module.exports = {
    name: 'gemini',
    category: 'general',
    description: 'Bertanya kepada Gemini AI.',
    execute: async (sock, msg, args) => {
        const query = args.join(' ');
        if (!query) {
            return sock.sendMessage(msg.key.remoteJid, { text: 'Mohon sertakan pertanyaan Anda setelah perintah !gemini.' }, { quoted: msg });
        }

        try {
            
            // Panggil fungsi AI
            const response = await askGemini(query);
            
            // Kirim hasil dari AI
            await sock.sendMessage(msg.key.remoteJid, { text: response }, { quoted: msg });

        } catch (error) {
            console.error("Error pada perintah !gemini:", error.message);
            // Kirim pesan error yang lebih informatif ke pengguna
            await sock.sendMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    }
};