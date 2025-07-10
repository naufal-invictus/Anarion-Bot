// src/handlers/messageHandler.js
const path = require('path');
const fs = require('fs-extra');
const db = require('../utils/db');
const botState = require('../utils/botState');
const { incrementActivity } = require('../utils/leveling.js');
const antiToxic = require('../utils/antiToxic'); // Import modul antiToxic
const { sendBotMessage, getLoggerInstance } = require('../utils/botMessenger'); // Import sendBotMessage dan logger getter

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


module.exports = async (sock, msg, logger) => { // 'sock' dan 'logger' masih diterima di sini dari index.js
    const { message, key } = msg;
    const text = message?.conversation || message?.extendedTextMessage?.text || '';
    const senderJid = key.participant || key.remoteJid;
    const groupJid = key.remoteJid;
    const config = await db.readData('config');
    const pinoLogger = getLoggerInstance(); // Dapatkan instance logger dari botMessenger

    // ======================== DEBUGGING ========================
    if (groupJid.endsWith('@g.us')) {
        const groupCategory = config.groups[groupJid];
        if (pinoLogger) {
            pinoLogger.debug(`[DEBUG] Pesan dari Grup ID: ${groupJid}`);
            pinoLogger.debug(`[DEBUG] Kategori Grup terdeteksi: ${groupCategory}`);
        } else {
            console.debug(`[DEBUG] Pesan dari Grup ID: ${groupJid}`); // Fallback jika logger belum terinisialisasi
            console.debug(`[DEBUG] Kategori Grup terdeteksi: ${groupCategory}`);
        }
    }
    // =========================================================

    // --- ANTI-TOXIC CHECK (SEBELUM PEMROSESAN PERINTAH) ---
    const isToxic = await antiToxic.checkToxic(text, senderJid, groupJid, msg.key);
    if (isToxic) {
        if (pinoLogger) pinoLogger.info({ user: senderJid, group: groupJid, message: text }, 'Pesan toxic terdeteksi, menghentikan pemrosesan perintah.');
        return; // Hentikan pemrosesan lebih lanjut jika pesan toxic
    }

    // --- Logika Pemberian XP ---
    const groupCategory = config.groups[groupJid];
    if (groupJid.endsWith('@g.us') && groupCategory && groupCategory !== 'blocked') {
        incrementActivity(senderJid);
    }

    if (!text.startsWith('!')) return; // Hanya proses jika berupa perintah

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
                if (pinoLogger) pinoLogger.warn({ sender: senderJid, command: commandName }, 'Aksi spam terdeteksi.');
                // Mengirim pesan peringatan kepada pengguna
                await sendBotMessage(msg.key.remoteJid, { text: `⚠️ Anda terlalu cepat! Mohon tunggu beberapa detik sebelum menggunakan perintah lagi.` }, { quoted: msg });
                return;
            }
        }
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
        if (pinoLogger) pinoLogger.info({ from, in: groupInfo, command: text }, `Perintah diterima`);
        
        // Teruskan 'sock' ke perintah karena beberapa perintah mungkin masih membutuhkannya
        // untuk fungsi Baileys spesifik yang belum dibungkus oleh botMessenger.
        await command.execute(sock, msg, args, userRole);
    } catch (error) {
        if (pinoLogger) pinoLogger.error({ err: error, command: commandName }, `Error tidak tertangani pada handler utama`);
        // JANGAN kirim error ke WA dari sini; perintah akan menangani pesan error yang menghadap pengguna mereka sendiri.
    }
};