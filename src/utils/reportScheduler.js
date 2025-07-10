const db = require('./db');
const { getAndClearLog } = require('./activityLogger');
const { sendBotMessage } = require('./botMessenger'); // Tambahkan ini

const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;

// Fungsi untuk membuat dan mengirim laporan
const generateAndSendReport = async (sock) => {
    try {
        const config = await db.readData('config');
        const adminGroupJid = config.adminReportGroup;

        if (!adminGroupJid) {
            console.warn('Grup admin untuk laporan tidak diatur. Laporan dilewati.');
            return null;
        }

        const activities = await getAndClearLog();
        if (activities.length === 0) {
            return 'Tidak ada aktivitas baru untuk dilaporkan.';
        }

        let reportText = `*LAPORAN AKTIVITAS GRUP KOMUNITAS*\n*Periode:* 3 Hari Terakhir\n\n`;
        const joins = activities.filter(a => a.type === 'join');
        const leaves = activities.filter(a => a.type === 'leave');

        if (joins.length > 0) {
            reportText += `*📈 Anggota Baru (${joins.length}):*\n`;
            joins.forEach(a => {
                reportText += `• @${a.userJid.split('@')[0]} bergabung di "${a.groupName}"\n  (Waktu: ${a.timestamp})\n`;
            });
            reportText += '\n';
        }

        if (leaves.length > 0) {
            reportText += `*📉 Anggota Keluar (${leaves.length}):*\n`;
            leaves.forEach(a => {
                reportText += `• @${a.userJid.split('@')[0]} keluar dari "${a.groupName}"\n  (Waktu: ${a.timestamp})\n`;
            });
        }

        await sendBotMessage(adminGroupJid, { text: reportText.trim() });
        return `Laporan aktivitas berhasil dikirim ke grup ${adminGroupJid}`;

    } catch (error) {
        console.error('Gagal menjalankan tugas laporan:', error);
        return 'Terjadi kesalahan saat membuat laporan.';
    }
};


const start = (sock) => {
    console.log('✅ Penjadwal laporan otomatis telah dimulai.');
    setInterval(() => {
        console.log('Menjalankan tugas laporan terjadwal...');
        generateAndSendReport(sock);
    }, threeDaysInMillis);
};

module.exports = { start, generateAndSendReport };