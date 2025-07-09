const cron = require('node-cron');
const { resetActivity } = require('./leveling.js');

const start = () => {
    console.log('✅ Penjadwal reset aktivitas telah dimulai.');

    // Setiap hari pada pukul 00:00 (tengah malam)
    cron.schedule('0 0 * * *', () => {
        resetActivity('daily');
    }, {
        timezone: "Asia/Jakarta"
    });

    // Setiap hari Senin pada pukul 00:00
    cron.schedule('0 0 * * 1', () => {
        resetActivity('weekly');
    }, {
        timezone: "Asia/Jakarta"
    });

    // Setiap tanggal 1 pada pukul 00:00
    cron.schedule('0 0 1 * *', () => {
        resetActivity('monthly');
    }, {
        timezone: "Asia/Jakarta"
    });
};

module.exports = { start };