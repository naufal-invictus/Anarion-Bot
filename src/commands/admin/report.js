const { getAllUsers } = require('../../utils/leveling.js');

// Fungsi helper untuk memformat daftar top 10
const formatTop10 = (usersArray, period, memberMap) => {
    let text = `*🏆 TOP 10 MEMBER TERAKTIF 🏆*\n*Periode: ${period.toUpperCase()}*\n\n`;

    const activeUsers = usersArray.filter(u => u.count > 0);

    if (activeUsers.length === 0) {
        return text + "_Tidak ada aktivitas yang tercatat untuk periode ini._";
    }
    
    activeUsers.slice(0, 10).forEach((user, index) => {
        const name = memberMap.get(user.jid) || user.jid.split('@')[0];
        text += `*${index + 1}.* ${name} - *${user.count}* Pesan\n`;
    });

    return text;
};

module.exports = {
    name: 'report',
    category: 'admin',
    description: 'Menampilkan laporan aktivitas anggota. Pilihan: day, week, month, all.',
    execute: async (sock, msg, args) => {
        try {
            const periodInput = args[0]?.toLowerCase();
            if (!['day', 'week', 'month', 'all'].includes(periodInput)) {
                return sock.sendMessage(msg.key.remoteJid, { text: 'Format salah. Gunakan `!report <day|week|month|all>`' }, { quoted: msg });
            }

            const jid = msg.key.remoteJid;
            if (!jid.endsWith('@g.us')) {
                return sock.sendMessage(jid, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
            }

            await sock.sendMessage(jid, { text: `Mengumpulkan data untuk laporan *${periodInput.toUpperCase()}*...` }, { quoted: msg });

            const groupMetadata = await sock.groupMetadata(jid);
            const allUsersData = getAllUsers();
            
            const memberMap = new Map();
            for (const p of groupMetadata.participants) {
                memberMap.set(p.id, p.name || p.notify || p.id.split('@')[0]);
            }
            
            // ================== BAGIAN YANG DIPERBAIKI ==================
            // Mapping dari input pengguna ke key di database
            const periodMap = {
                day: 'daily',
                week: 'weekly',
                month: 'monthly',
                all: 'total'
            };
            const periodKey = periodMap[periodInput];
            // ==========================================================

            const usersArray = Object.keys(allUsersData)
                .filter(userJid => memberMap.has(userJid))
                .map(jid => {
                    const activity = allUsersData[jid].activity || {}; 
                    const count = activity[periodKey] || 0; // Gunakan periodKey yang sudah benar
                    return { jid: jid, count: count };
                });

            usersArray.sort((a, b) => b.count - a.count);

            const reportText = formatTop10(usersArray, periodInput, memberMap);
            await sock.sendMessage(jid, { text: reportText });

        } catch (error) {
            console.error('Error pada perintah !report:', error);
            await sock.sendMessage(msg.key.remoteJid, { text: 'Gagal membuat laporan aktivitas.' }, { quoted: msg });
        }
    },
};