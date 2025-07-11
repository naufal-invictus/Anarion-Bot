// src/commands/general/settypo.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { updateUserData } = require('../../utils/leveling');

module.exports = {
    name: 'settypo',
    category: 'general',
    description: 'Mengatur typology/kepribadian Anda di profil (misal: INFJ, ENTP).',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const newTypology = args.join(' ').trim().toUpperCase(); // Ubah ke huruf kapital untuk konsistensi

        if (!newTypology) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan tipe typology Anda. Contoh: `!settypo INFJ`' }, { quoted: msg });
        }
        if (newTypology.length > 15) { // Batasan panjang typology
            return sendBotMessage(msg.key.remoteJid, { text: 'Format typology terlalu panjang. Maksimal 10 karakter.' }, { quoted: msg });
        }
        // Anda bisa menambahkan validasi lebih lanjut di sini jika perlu (misal: hanya tipe MBTI valid)

        try {
            updateUserData(senderJid, { personality: newTypology });
            await sendBotMessage(msg.key.remoteJid, { text: `✅ Typology Anda berhasil diatur menjadi *${newTypology}*.` }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !settypo:", error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !settypo.` }, { quoted: msg });
        }
    },
};