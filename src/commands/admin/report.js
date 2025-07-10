// src/commands/admin/report.js (Diperbarui untuk tagging JID)
const { getAllUsers } = require('../../utils/leveling.js');
const botMessenger = require('../../utils/botMessenger'); // Import botMessenger

// Fungsi helper untuk memformat daftar top 10
// Mengembalikan objek dengan text dan array mentions
const formatTop10 = (usersArray, period, memberMap) => {
    let text = `*🏆 TOP 10 MEMBER TERAKTIF 🏆*\n*Periode: ${period.toUpperCase()}*\n\n`;
    const mentions = []; // Array untuk menyimpan JID yang akan di-tag

    const activeUsers = usersArray.filter(u => u.count > 0);

    if (activeUsers.length === 0) {
        text += "_Tidak ada aktivitas yang tercatat untuk periode ini._";
    } else {
        activeUsers.slice(0, 10).forEach((user, index) => {
            const name = memberMap.get(user.jid) || user.jid.split('@')[0];
            text += `*${index + 1}.* @${user.jid.split('@')[0]} - *${user.count}* Pesan\n`; // Tambahkan @ di teks
            mentions.push(user.jid); // Tambahkan JID ke array mentions
        });
    }

    return { text, mentions }; // Mengembalikan objek
};

module.exports = {
    name: 'report',
    category: 'admin',
    description: 'Menampilkan laporan aktivitas anggota. Pilihan: day, week, month, all. Hasil akan me-tag anggota.',
    execute: async (sock, msg, args) => { // Parameter 'sock' masih bisa diterima
        try {
            const periodInput = args[0]?.toLowerCase();
            if (!['day', 'week', 'month', 'all'].includes(periodInput)) {
                return botMessenger.sendBotMessage(msg.key.remoteJid, { text: 'Format salah. Gunakan `!report <day|week|month|all>`' }, { quoted: msg });
            }

            const jid = msg.key.remoteJid;
            if (!jid.endsWith('@g.us')) {
                return botMessenger.sendBotMessage(jid, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
            }

            await botMessenger.sendBotMessage(jid, { text: `Mengumpulkan data untuk laporan *${periodInput.toUpperCase()}*...` }, { quoted: msg });

            const groupMetadata = await sock.groupMetadata(jid); // Menggunakan sock untuk groupMetadata
            const allUsersData = getAllUsers();
            
            const memberMap = new Map();
            for (const p of groupMetadata.participants) {
                memberMap.set(p.id, p.name || p.notify || p.id.split('@')[0]);
            }
            
            const periodMap = {
                day: 'daily',
                week: 'weekly',
                month: 'monthly',
                all: 'total'
            };
            const periodKey = periodMap[periodInput];

            const usersArray = Object.keys(allUsersData)
                .filter(userJid => memberMap.has(userJid))
                .map(jid => {
                    const activity = allUsersData[jid].activity || {}; 
                    const count = activity[periodKey] || 0; 
                    return { jid: jid, count: count };
                });

            usersArray.sort((a, b) => b.count - a.count);

            // Dapatkan teks laporan dan array mentions
            const { text: reportText, mentions: reportMentions } = formatTop10(usersArray, periodInput, memberMap);
            
            // Kirim pesan dengan tagging JID
            await botMessenger.sendBotMessage(jid, {
                text: reportText,
                mentions: reportMentions // Teruskan array mentions ke sendBotMessage
            });

        } catch (error) {
            console.error('Error pada perintah !report:', error);
            await botMessenger.sendBotMessage(msg.key.remoteJid, { text: 'Gagal membuat laporan aktivitas.' }, { quoted: msg });
        }
    },
};