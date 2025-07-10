const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'shutdown',
    category: 'admin',
    description: 'Mematikan bot secara total.',
    execute: async (sock, msg, args, userRole) => {
        // Hanya owner yang bisa mematikan bot
        if (userRole !== 'owner') {
            return sendBotMessage(msg.key.remoteJid, { text: '\u26d4 Perintah ini hanya untuk Owner.' }, { quoted: msg });
        }

        try {
            await sendBotMessage(msg.key.remoteJid, { text: '\u26d4 Bot akan dimatikan. Sampai jumpa!' }, { quoted: msg });
            // Menggunakan process.exit(0) menandakan keluar secara normal, PM2 tidak akan restart
            process.exit(0);
        } catch (error) {
            console.error('Error pada perintah !shutdown:', error);
            await sendBotMessage(msg.key.remoteJid, { text: 'Gagal mematikan bot.' }, { quoted: msg });
        }
    },
};