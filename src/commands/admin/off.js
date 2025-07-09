const botState = require('../../utils/botState');

module.exports = {
    name: 'off',
    category: 'admin',
    description: 'Menonaktifkan bot.',
    execute: async (sock, msg) => {
        try {
            botState.setActive(false);
            await sock.sendMessage(msg.key.remoteJid, { text: '⛔ Bot telah dinonaktifkan.' }, { quoted: msg });
        } catch (error) {
            console.error(`❌ Error pada perintah !${this.name}:`, error);
            await sock.sendMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};