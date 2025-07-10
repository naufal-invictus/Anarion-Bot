const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'math',
    category: 'game',
    access: { // Command availability by group category
        general: true,
        game: true,
        language: false
    },
    description: 'A simple math game (placeholder).',
    execute: async (sock, msg, args) => {
        // Placeholder for math game logic
        await sendBotMessage(msg.key.remoteJid, { text: '🚧 The !saymath command is currently under construction.' }, { quoted: msg });
    },
    
};