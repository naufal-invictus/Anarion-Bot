module.exports = {
    name: 'shutdown',
    category: 'admin',
    description: 'Mematikan bot secara total.',
    execute: async (sock, msg, args, userRole) => {
        // Hanya owner yang bisa mematikan bot
        if (userRole !== 'owner') {
            return sock.sendMessage(msg.key.remoteJid, { text: '⛔ Perintah ini hanya untuk Owner.' }, { quoted: msg });
        }

        try {
            await sock.sendMessage(msg.key.remoteJid, { text: '⛔ Bot akan dimatikan. Sampai jumpa!' }, { quoted: msg });
            // Menggunakan process.exit(0) menandakan keluar secara normal, PM2 tidak akan restart
            process.exit(0);
        } catch (error) {
            console.error('Error pada perintah !shutdown:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Gagal mematikan bot.' }, { quoted: msg });
        }
    },
};