const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'restart',
    category: 'admin',
    description: 'Memulai ulang (restart) bot.',
    execute: async (sock, msg, args, userRole) => {
        // Hanya owner atau developer yang bisa restart
        if (userRole !== 'owner' && userRole !== 'developer') {
            return sendBotMessage(msg.key.remoteJid, { text: '\u26d4 Perintah ini hanya untuk Owner atau Developer.' }, { quoted: msg });
        }

        try {
            await sendBotMessage(msg.key.remoteJid, { text: '\u2705 Bot akan di-restart...' }, { quoted: msg });
            // Menggunakan process.exit(1) agar PM2 otomatis menghidupkan kembali bot
            process.exit(1);
        } catch (error) {
            console.error('Error pada perintah !restart:', error);
            await sendBotMessage(msg.key.remoteJid, { text: 'Gagal me-restart bot.' }, { quoted: msg });
        }
    },
};