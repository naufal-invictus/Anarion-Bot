const botState = require('../../utils/botState');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'off',
    category: 'admin',
    description: 'Menonaktifkan bot.',
    execute: async (sock, msg) => {
        try {
            botState.setActive(false);
            await sendBotMessage(msg.key.remoteJid, { text: '\u26d4 Bot telah dinonaktifkan.' }, { quoted: msg });
        } catch (error) {
            console.error(`\u274c Error pada perintah !${this.name}:`, error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};