const db = require('../utils/db');
const { logActivity } = require('../utils/activityLogger');
const { sendBotMessage } = require('../utils/botMessenger'); // Tambahkan ini

module.exports = async (sock, { id, participants, action }) => {
    try {
        const config = await db.readData('config');
        const groupCategory = config.groups[id];

        // --- Hanya proses grup yang merupakan bagian dari komunitas ---
        if (groupCategory && groupCategory !== 'blocked') {
            const groupMetadata = await sock.groupMetadata(id);
            const groupData = await db.readData('groups');
            const groupInfo = groupData[id];

            // --- Welcome/Goodbye Message (jika ada) ---
            if (groupInfo) {
                for (const jid of participants) {
                    if (action === 'add' && groupInfo.welcomeMessage) {
                        const welcomeText = groupInfo.welcomeMessage.replace('@user', `@${jid.split('@')[0]}`);
                        await sendBotMessage(id, { text: welcomeText, mentions: [jid] });
                    } else if (action === 'remove' && groupInfo.goodbyeMessage) {
                        const goodbyeText = groupInfo.goodbyeMessage.replace('@user', `@${jid.split('@')[0]}`);
                        await sendBotMessage(id, { text: goodbyeText, mentions: [jid] });
                    }
                }
            }

            // --- Pencatatan untuk Laporan Admin ---
            for (const jid of participants) {
                if (action === 'add') {
                    await logActivity('join', jid, groupMetadata.subject);
                } else if (action === 'remove') {
                    await logActivity('leave', jid, groupMetadata.subject);
                }
            }
        }
    } catch (error) {
        console.error(`Error di group update handler untuk ${id}:`, error);
    }
};