const db = require('../../utils/db');
const { sendBotMessage } = require('../../utils/botMessenger');
module.exports = {
    name: 'addadmin',
    category: 'admin',
    description: 'Promote a user to an admin role.',
    execute: async (sock, msg, args, userRole) => {
        try {
            if (userRole !== 'owner') {
                return sendBotMessage(msg.key.remoteJid, { text: '⛔ Perintah ini hanya untuk Owner.' }, { quoted: msg });
            }
            
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mentionedJid) {
                 return sendBotMessage(msg.key.remoteJid, { text: 'Tag pengguna yang ingin dijadikan admin.\nContoh: `!addadmin @user`' }, { quoted: msg });
            }

            const config = await db.readData('config');
            if (!config.admins.includes(mentionedJid)) {
                config.admins.push(mentionedJid);
                await db.writeData('config', config);
                await sendBotMessage(msg.key.remoteJid, { text: `✅ Berhasil mempromosikan @${mentionedJid.split('@')[0]} menjadi Admin.`, mentions: [mentionedJid] }, { quoted: msg });
            } else {
                await sendBotMessage(msg.key.remoteJid, { text: `Pengguna @${mentionedJid.split('@')[0]} sudah menjadi Admin.`, mentions: [mentionedJid] }, { quoted: msg });
            }
        } catch (error) {
            console.error(`❌ Error pada perintah !${this.name}:`, error);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};