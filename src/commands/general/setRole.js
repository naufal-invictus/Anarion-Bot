// src/commands/general/setrole.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { updateUserData, getUserData } = require('../../utils/leveling');

// Daftar peran yang tersedia
const AVAILABLE_ROLES = [
    "Gamer",
    "Penunggu Notif",
    "Si Paling Introvert",
    "Ekstrovert Kebanyakan Ngopi",
    "Anak Indie Senja",
    "Kardigan Enthusiast",
    "Master Rebahan",
    "Pawang Hujan Lokal",
    "Detektif Private Chat",
    "Kang Ghosting Profesional",
    "Pemuja Kuota Gratis",
    "Influencer Makanan",
    "Dukun Online",
    "Penimbun Stiker WA",
    "Si Paling Filosofis",
    "Pakar Cocoklogi",
    "Pawang Jemuran",
    "Penjelajah Timeline",
    "Guru Ngakak",
    "Kucing Oren Garis Keras",
    "Budak Korporat (Tapi rebahan)"
];

module.exports = {
    name: 'setrole',
    category: 'general',
    description: 'Mengatur peran/role Anda dari daftar yang tersedia. Gunakan !listroles untuk melihat daftar.',
    access: {
        general: true,
        game: true,
        language: true
    },
    execute: async (sock, msg, args) => {
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const requestedRole = args.join(' ').trim();

        if (!requestedRole) {
            let replyText = 'Mohon sertakan peran yang ingin Anda atur. Contoh: `!setrole Gamer`\n\n';
            replyText += 'Untuk melihat daftar peran yang tersedia, gunakan perintah: `!listroles`';
            return sendBotMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
        }

        const roleExists = AVAILABLE_ROLES.some(role => role.toLowerCase() === requestedRole.toLowerCase());

        if (!roleExists) {
            let replyText = `Peran "*${requestedRole}*" tidak ditemukan dalam daftar yang tersedia. 🥺\n\n`;
            replyText += 'Untuk melihat daftar peran yang tersedia, gunakan perintah: `!listroles`';
            return sendBotMessage(msg.key.remoteJid, { text: replyText }, { quoted: msg });
        }

        // Ambil data pengguna saat ini
        const userData = getUserData(senderJid);
        let currentRoles = userData.roles || [];

        // Hapus peran sebelumnya jika ada, lalu tambahkan peran baru
        // Asumsi hanya bisa punya 1 peran kustom dari daftar ini
        currentRoles = currentRoles.filter(role => !AVAILABLE_ROLES.includes(role)); // Hapus peran lama yang ada di list
        currentRoles.push(requestedRole); // Tambahkan peran baru

        try {
            updateUserData(senderJid, { roles: currentRoles });
            await sendBotMessage(msg.key.remoteJid, { text: `✅ Peran Anda berhasil diatur menjadi *${requestedRole}*.` }, { quoted: msg });
        } catch (error) {
            console.error("Error di perintah !setrole:", error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !setrole.` }, { quoted: msg });
        }
    },
};