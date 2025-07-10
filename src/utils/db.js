// src/utils/db.js (Diperbarui untuk menghapus log debug)
const fs = require('fs-extra');
const path = require('path');

// Perbaikan: Path yang benar ke folder 'data' di root project
const dataDir = path.join(__dirname, '..', '..', 'data'); 

const configPath = path.join(dataDir, 'config.json');
const groupsPath = path.join(dataDir, 'groups.json');
const messagesPath = path.join(dataDir, 'messages.json');

// Pastikan direktori data ada
fs.ensureDirSync(dataDir);

// Inisialisasi file JSON jika belum ada
if (!fs.existsSync(configPath)) {
    console.log(`[DB_INIT] Membuat file config.json kosong di: ${configPath}`); // Log ini akan tetap ada jika file baru dibuat
    fs.writeFileSync(configPath, JSON.stringify({
        owner: [],
        developers: [],
        admins: [],
        groups: {}
    }, null, 2));
}

if (!fs.existsSync(groupsPath)) {
    console.log(`[DB_INIT] Membuat file groups.json kosong di: ${groupsPath}`); // Log ini akan tetap ada jika file baru dibuat
    fs.writeFileSync(groupsPath, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(messagesPath)) {
    console.log(`[DB_INIT] Membuat file messages.json kosong di: ${messagesPath}`); // Log ini akan tetap ada jika file baru dibuat
    fs.writeFileSync(messagesPath, JSON.stringify({
        defaultWelcomeMessage: "Selamat datang, @{tag} di grup kami! Senang Anda bergabung.",
        defaultGoodbyeMessage: "Sampai jumpa, @{tag}! Kami akan merindukanmu. Jika ingin bergabung kembali, silakan klik link grup ini: [LINK_GRUP_ANDA]",
        defaultGoodbyePrivateMessage: "Halo @{tag}, Anda telah keluar dari grup. Jika ingin bergabung kembali, silakan klik link grup ini: [LINK_GRUP_ANDA]."
    }, null, 2));
}


async function readData(file) {
    let filePath;
    if (file === 'config') {
        filePath = configPath;
    } else if (file === 'groups') {
        filePath = groupsPath;
    } else if (file === 'messages') {
        filePath = messagesPath;
    } else {
        throw new Error(`File tidak dikenal: ${file}`);
    }

    try {
        const data = await fs.readFile(filePath, 'utf8');
        // console.log(`[DB_READ_DEBUG] Konten mentah dari ${file} (${filePath}):\n---MULAI KONTEN---\n${data}\n---AKHIR KONTEN---`); // <<< BARIS INI DIHAPUS/DIKOMENTARI
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Gagal membaca atau mengurai file ${file}:`, error);
        throw new Error(`[DB_ERROR] Gagal membaca atau mengurai ${file}. Periksa integritas file: ${error.message}`);
    }
}

async function writeData(file, data) {
    let filePath;
    if (file === 'config') {
        filePath = configPath;
    } else if (file === 'groups') {
        filePath = groupsPath;
    } else if (file === 'messages') {
        filePath = messagesPath;
    } else {
        throw new Error(`File tidak dikenal: ${file}`);
    }

    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`❌ Error menulis ke file ${file}:`, error);
        throw new Error(`[DB_ERROR] Gagal menulis ke ${file}. Periksa izin atau ruang disk: ${error.message}`);
    }
}

module.exports = {
    readData,
    writeData
};