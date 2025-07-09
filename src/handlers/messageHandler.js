const path = require('path');
const fs = require('fs-extra');
const db = require('../utils/db');
const botState = require('../utils/botState');
const { incrementActivity } = require('../utils/leveling.js'); // Ganti impor
const { addXP } = require('../utils/leveling.js');

// --- Konfigurasi Anti-Spam ---
// Map untuk menyimpan timestamp perintah terakhir dari setiap pengguna
const antiSpam = new Map();
// Waktu cooldown dalam milidetik (contoh: 5 detik)
const SPAM_COOLDOWN = 5000; 

const commands = new Map();

// Fungsi loadCommands tetap sama...
async function loadCommands() {
    const commandDir = path.join(__dirname, '..', 'commands');
    const categories = await fs.readdir(commandDir);

    for (const category of categories) {
        const categoryPath = path.join(commandDir, category);
        if ((await fs.stat(categoryPath)).isDirectory()) {
            const commandFiles = (await fs.readdir(categoryPath)).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                try {
                    const command = require(path.join(categoryPath, file));
                    commands.set(command.name, command);
                } catch (error) {
                    console.error(`❌ Gagal memuat perintah ${file} di ${category}:`, error);
                }
            }
        }
    }
    console.log(`✅ Berhasil memuat ${commands.size} perintah.`);
}
loadCommands();


module.exports = async (sock, msg, logger) => {
    const { message, key } = msg;
    const text = message?.conversation || message?.extendedTextMessage?.text || '';
    const senderJid = key.participant || key.remoteJid;
    const groupJid = key.remoteJid;
    const config = await db.readData('config');
    // ======================== DEBUGGING ========================
    // Log ini akan muncul di terminal untuk SETIAP pesan yang masuk ke grup
    if (groupJid.endsWith('@g.us')) {
        const groupCategory = config.groups[groupJid];
        console.log(`[DEBUG] Pesan dari Grup ID: ${groupJid}`);
        console.log(`[DEBUG] Kategori Grup terdeteksi: ${groupCategory}`);
    }
    // =========================================================
    // --- Logika Pemberian XP ---
    const groupCategory = config.groups[groupJid];
    if (groupJid.endsWith('@g.us') && groupCategory && groupCategory !== 'blocked') {
        incrementActivity(senderJid); // Panggil fungsi baru ini
    }
    
    if (!text.startsWith('!')) return;

    // Cek status On/Off bot
    if (!botState.isActive() && !text.startsWith('!on')) {
        return;
    }

    const args = text.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);

    if (!command) return;

    // --- Permission & Anti-Spam Logic ---
    const userRole = config.owner.includes(senderJid) ? 'owner' :
                     config.developers.includes(senderJid) ? 'developer' :
                     config.admins.includes(senderJid) ? 'admin' : 'user';

    // 1. Cek Anti-Spam (tidak berlaku untuk Owner dan Developer)
    if (userRole !== 'owner' && userRole !== 'developer') {
        const now = Date.now();
        const lastCommandTime = antiSpam.get(senderJid);

        if (lastCommandTime) {
            const timeDiff = now - lastCommandTime;
            if (timeDiff < SPAM_COOLDOWN) {
                // Jika terdeteksi spam, kirim peringatan dan hentikan eksekusi
                logger.warn({ sender: senderJid, command: commandName }, 'Aksi spam terdeteksi.');
                // Mengirim pesan peringatan hanya sekali saja agar tidak ikut jadi spam
                // (Pesan ini bisa dihapus jika tidak diinginkan)
                await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Anda terlalu cepat! Mohon tunggu beberapa detik sebelum menggunakan perintah lagi.` }, { quoted: msg });
                return; 
            }
        }
        // Update timestamp perintah terakhir pengguna
        antiSpam.set(senderJid, now);
    }

    // 2. Cek Permission Admin
    if (command.category === 'admin' && !['owner', 'developer', 'admin'].includes(userRole)) {
        return; // Abaikan jika bukan admin
    }

    // --- Eksekusi Perintah ---
    try {
        const from = senderJid.split('@')[0];
        const groupInfo = groupJid.endsWith('@g.us') ? `Grup (${groupJid.slice(0, 9)}...)` : 'DM';
        logger.info({ from, in: groupInfo, command: text }, `Perintah diterima`);
        
        await command.execute(sock, msg, args, userRole);
    } catch (error) {
        logger.error({ err: error, command: commandName }, `Error tidak tertangani pada handler utama`);
    }
};