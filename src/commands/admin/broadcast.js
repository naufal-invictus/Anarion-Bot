import db from '../../utils/db.js';
import { sendBotMessage } from '../../utils/botMessenger.js'; // Tambahkan ini

export default {
    name: 'broadcast',
    category: 'admin',
    description: 'Mengirim pesan ke semua grup yang terdaftar di broadcast list.',
    execute: async (sock, msg, args) => {
        try {
            const message = args.join(' ');
            if (!message) {
                return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan pesan untuk broadcast.' }, { quoted: msg });
            }

            const config = await db.readData('config');
            const broadcastGroups = config.broadcastGroups || [];

            if (broadcastGroups.length === 0) {
                return sendBotMessage(msg.key.remoteJid, { text: 'Tidak ada grup yang terdaftar untuk broadcast.' }, { quoted: msg });
            }

            let successCount = 0;
            let failCount = 0;

            const broadcastMessage = `*BROADCAST DARI ADMIN*\n\n${message}`;

            for (const groupId of broadcastGroups) {
                try {
                    await sendBotMessage(groupId, { text: broadcastMessage });
                    successCount++;
                } catch (e) {
                    failCount++;
                    console.error(`Gagal broadcast ke ${groupId}:`, e);
                }
            }

            await sendBotMessage(msg.key.remoteJid, {
                text: `Pesan broadcast selesai.\nBerhasil: ${successCount} grup.\nGagal: ${failCount} grup.`
            }, { quoted: msg });

        } catch (error) {
            console.error("Error di perintah !broadcast:", error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !broadcast.` }, { quoted: msg });
        }
    },
};