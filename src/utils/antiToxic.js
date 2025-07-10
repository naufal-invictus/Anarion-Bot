// src/utils/antiToxic.js
const db = require('./db.js');
const leveling = require('./leveling.js');
const { sendBotMessage, getClientSock, getLoggerInstance } = require('./botMessenger.js'); // Import botMessenger dan getter

// Tidak perlu TOXIC_THRESHOLD lagi karena scolding terjadi di setiap pelanggaran
// const TOXIC_THRESHOLD = 3;

// Helper function untuk mendapatkan nama grup menggunakan clientSock dari botMessenger
async function getGroupName(jid) {
    if (!jid.endsWith('@g.us')) return 'Personal Chat';
    const clientSock = getClientSock(); // Dapatkan instance sock
    const logger = getLoggerInstance(); // Dapatkan instance logger

    if (!clientSock) {
        if (logger) logger.warn('Client sock tidak tersedia di antiToxic untuk mendapatkan nama grup. botMessenger belum terinisialisasi sepenuhnya?');
        return 'Unknown Group (Sock not ready)';
    }
    try {
        const metadata = await clientSock.groupMetadata(jid);
        return metadata.subject || 'Unknown Group';
    } catch (error) {
        if (logger) logger.error('Gagal mendapatkan metadata grup untuk anti-toxic:', error);
        return 'Unknown Group (Error)';
    }
}

// Fungsi untuk memeriksa pesan toxic
const checkToxic = async (messageText, userJid, groupJid, msgKey) => {
    const logger = getLoggerInstance(); // Dapatkan instance logger untuk penggunaan internal antiToxic

    try {
        const config = await db.readData('config');
        // Baca dari file JSON terpisah
        const toxicWords = await db.readData(config.toxicWordsFile || 'toxic_words');
        const scoldingMessages = await db.readData(config.scoldingMessagesFile || 'scolding_messages');
        const toxicAdminJid = config.toxicAdminJid; // Admin etika

        if (!Array.isArray(toxicWords) || toxicWords.length === 0) {
            if (logger) logger.warn('Daftar kata toxic kosong atau tidak valid. Fitur anti-toxic dinonaktifkan.');
            return false; // Tidak ada kata toxic yang dikonfigurasi
        }
        if (!Array.isArray(scoldingMessages) || scoldingMessages.length === 0) {
            if (logger) logger.warn('Daftar pesan scolding kosong atau tidak valid. Fitur scolding mungkin tidak berfungsi.');
        }

        const lowerCaseMessage = messageText.toLowerCase();
        let isToxic = false;

        // Implementasi deteksi toxic yang "tidak pakai AI"
        // Ini akan sangat sederhana dan mungkin menghasilkan false positif.
        // Contoh: "aku suka anjing dia" akan mendeteksi "anjing".
        for (const word of toxicWords) {
            if (lowerCaseMessage.includes(word.toLowerCase())) {
                isToxic = true;
                break;
            }
        }

        if (isToxic) {
            const userData = leveling.getUserData(userJid);
            userData.toxic_violations = (userData.toxic_violations || 0) + 1;
            leveling.updateUserData(userJid, { toxic_violations: userData.toxic_violations });

            const userName = msgKey.pushName || userJid.split('@')[0];
            const groupName = await getGroupName(groupJid);

            // Notifikasi admin setiap kali ada pelanggaran (ke admin etika)
            if (toxicAdminJid) {
                let adminNotification = `⚠️ *[ANTI-TOXIC]* Pelanggaran terdeteksi!\n\n`;
                adminNotification += `*User:* @${userJid.split('@')[0]} (${userName})\n`;
                adminNotification += `*Grup:* ${groupName} (${groupJid.split('@')[0]})\n`;
                adminNotification += `*Pesan:* "${messageText}"\n`;
                adminNotification += `*Pelanggaran ke:* ${userData.toxic_violations}\n`;
                adminNotification += `*Admin Etika:* @${toxicAdminJid.split('@')[0]}`; // Mention admin di notifikasi ke admin

                await sendBotMessage(toxicAdminJid, { text: adminNotification, mentions: [userJid, toxicAdminJid] });
            }

            // Kirim pesan teguran ke grup
            let scoldingMessageIndex = userData.toxic_violations - 1; // 1st violation -> index 0, 2nd -> index 1, etc.
            if (scoldingMessageIndex >= scoldingMessages.length) {
                // Jika pelanggaran melebihi jumlah pesan scolding yang tersedia,
                // gunakan pesan terakhir atau loop kembali ke pesan pertama.
                // Untuk kasus ini, kita akan menggunakan pesan terakhir (ultimate gaya wibu) untuk pelanggaran ke-3 dan seterusnya.
                scoldingMessageIndex = scoldingMessages.length - 1;
            }

            const selectedScoldingMessage = scoldingMessages[scoldingMessageIndex];
            const finalScoldingMessage = selectedScoldingMessage.replace('@user', `@${userJid.split('@')[0]}`);

            // Mention user dan admin etika di pesan scolding di grup
            const mentions = [userJid];
            if (toxicAdminJid) {
                mentions.push(toxicAdminJid);
            }

            await sendBotMessage(groupJid, {
                text: `${finalScoldingMessage}\n\nNotifikasi juga dikirim ke Admin Etika: @${toxicAdminJid.split('@')[0]}`,
                mentions: mentions
            });

            // Jika mencapai 3 pelanggaran, reset penghitung
            if (userData.toxic_violations >= 3) {
                leveling.resetToxicViolations(userJid); // Reset pelanggaran setelah mencapai ultimate
            }

            return true; // Pesan terdeteksi toxic
        }

        return false; // Pesan tidak toxic
    } catch (error) {
        if (logger) logger.error('Error di antiToxic.checkToxic:', error);
        return false; // Asumsi tidak toxic jika terjadi error
    }
};

module.exports = {
    checkToxic,
};