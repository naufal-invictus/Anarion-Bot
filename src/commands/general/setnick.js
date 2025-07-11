// src/commands/general/setnick.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { updateUserData } = require('../../utils/leveling');

module.exports = {
    name: 'setnick',
    category: 'general',
    description: 'Mengatur nickname Anda yang ditampilkan di profil.',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const newNickname = args.join(' ').trim();

        if (!newNickname) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan nickname baru Anda. Contoh: `!setnick <nickname_baru>`' }, { quoted: msg });
        }
        if (newNickname.length > 20) { // Batasan panjang nickname
            return sendBotMessage(msg.key.remoteJid, { text: 'Nickname terlalu panjang. Maksimal 20 karakter.' }, { quoted: msg });
        }

        try {
            updateUserData(senderJid, { nickname: newNickname });
            await sendBotMessage(msg.key.remoteJid, { text: `✅ Nickname Anda berhasil diatur menjadi *${newNickname}*.` }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !setnick:", error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !setnick.` }, { quoted: msg });
        }
    },
};