const botState = require('../../utils/botState');

module.exports = {
    name: 'on',
    category: 'admin',
    description: 'Mengaktifkan bot.',
    execute: async (sock, msg) => {
        try {
            botState.setActive(true);
            await sock.sendMessage(msg.key.remoteJid, { text: '✅ Bot telah diaktifkan.' }, { quoted: msg });
        } catch (error) {
            console.error(`❌ Error pada perintah !${this.name}:`, error);
            await sock.sendMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};