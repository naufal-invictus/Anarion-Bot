// src/commands/admin/rpOff.js
const db = require('../../utils/db');

module.exports = {
    name: 'rp_off',
    category: 'admin',
    description: 'Menonaktifkan mode roleplay di grup ini.',
    execute: async (sock, msg, args, userRole) => {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
        }

        if (userRole !== 'owner' && userRole !== 'developer' && userRole !== 'admin') {
            return sock.sendMessage(jid, { text: '⛔ Perintah ini hanya untuk Admin grup atau lebih tinggi.' }, { quoted: msg });
        }

        try {
            const groupsData = await db.readData('groups');
            if (!groupsData[jid]) {
                // Inisialisasi data grup jika belum ada, termasuk default rpModeEnabled
                groupsData[jid] = { aiChatHistory: [], rpModeEnabled: false, welcomeMessage: "", goodbyeMessage: "" };
            } else {
                groupsData[jid].rpModeEnabled = false;
            }
            await db.writeData('groups', groupsData);
            await sock.sendMessage(jid, { text: '⛔ Mode roleplay telah dinonaktifkan untuk grup ini.' }, { quoted: msg });
        } catch (error) {
            console.error(`❌ Error pada perintah !${this.name}:`, error);
            await sock.sendMessage(jid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};