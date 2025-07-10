// src/utils/leveling.js
const fs = require('fs-extra');
const path = require('path');

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// Memuat data pengguna saat bot dimulai
const loadUsers = () => {
    try {
        if (fs.existsSync(usersFilePath)) {
            return fs.readJsonSync(usersFilePath);
        }
        fs.writeJsonSync(usersFilePath, {});
        return {};
    } catch (error) {
        console.error("Gagal memuat users.json:", error);
        return {};
    }
};

let users = loadUsers();

// Menyimpan data pengguna ke file
const saveUsers = () => {
    try {
        fs.writeJsonSync(usersFilePath, users, { spaces: 2 });
    } catch (error) {
        console.error("Gagal menyimpan users.json:", error);
    }
};

// Memastikan struktur data pengguna lengkap dengan data aktivitas dan pelanggaran toxic
const ensureUserData = (jid) => {
    if (!users[jid]) {
        users[jid] = {
            xp: 0,
            level: 0,
            roles: [],
            personality: 'Belum diatur',
            nickname: 'Pengguna Baru',
            activity: {
                daily: 0,
                weekly: 0,
                monthly: 0,
                total: 0
            },
            toxic_violations: 0 // <-- TAMBAH INI: Inisialisasi penghitung pelanggaran
        };
    } else {
        // Kompatibilitas untuk data lama: Pastikan field baru ada
        if (users[jid].activity === undefined) {
            users[jid].activity = { daily: 0, weekly: 0, monthly: 0, total: 0 };
        }
        if (users[jid].toxic_violations === undefined) {
            users[jid].toxic_violations = 0; // <-- TAMBAH INI: Pastikan ada untuk pengguna lama
        }
    }
};

module.exports = {
    // Fungsi untuk menambah aktivitas dan XP setiap kali ada pesan
    incrementActivity: (jid) => {
        ensureUserData(jid);

        // Tambah hitungan aktivitas
        users[jid].activity.daily += 1;
        users[jid].activity.weekly += 1;
        users[jid].activity.monthly += 1;
        users[jid].activity.total += 1;

        // Tambah XP dan cek kenaikan level
        const xpAmount = Math.floor(Math.random() * 5) + 1;
        users[jid].xp += xpAmount;
        const newLevel = Math.floor(0.1 * Math.sqrt(users[jid].xp));
        if (newLevel > users[jid].level) {
            users[jid].level = newLevel;
        }

        saveUsers();
    },

    // Fungsi untuk me-reset data aktivitas berdasarkan periode
    resetActivity: (period) => {
        console.log(`Me-reset data aktivitas untuk periode: ${period}...`);
        for (const jid in users) {
            if (users[jid].activity && users[jid].activity[period] !== undefined) {
                users[jid].activity[period] = 0;
            }
        }
        saveUsers();
        console.log(`Reset data ${period} selesai.`);
    },

    // Fungsi untuk mendapatkan semua data pengguna
    getAllUsers: () => {
        try {
            return fs.readJsonSync(usersFilePath);
        } catch (error) {
            console.error("Gagal membaca users.json secara langsung:", error);
            return {}; // Kembalikan objek kosong jika gagal
        }
    },
    getUserData: (jid) => {
        ensureUserData(jid);
        return users[jid];
    },
    // Fungsi baru untuk memperbarui dan menyimpan data pengguna (digunakan oleh antiToxic)
    updateUserData: (jid, dataToUpdate) => {
        ensureUserData(jid);
        Object.assign(users[jid], dataToUpdate);
        saveUsers();
    },
    // Fungsi baru untuk mereset pelanggaran toxic (digunakan oleh antiToxic)
    resetToxicViolations: (jid) => {
        ensureUserData(jid);
        users[jid].toxic_violations = 0;
        saveUsers();
    }
};