const botState = require('../../utils/botState');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'on',
    category: 'admin',
    description: 'Mengaktifkan bot.',
    execute: async (sock, msg) => {
        try {
            botState.setActive(true);
            await sendBotMessage(msg.key.remoteJid, { text: '\u2705 Bot telah diaktifkan.' }, { quoted: msg });
        } catch (error) {
            console.error(`\u274c Error pada perintah !${this.name}:`, error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};