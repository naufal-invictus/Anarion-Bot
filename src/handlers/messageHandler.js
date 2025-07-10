// src/handlers/messageHandler.js (Diperbarui untuk logging pesan grup)
const path = require('path');
const fs = require('fs-extra');
const db = require('../utils/db');
const botState = require('../utils/botState');
const { incrementActivity } = require('../utils/leveling.js');
const { askSmartAI } = require('../utils/ai.js');
const botMessenger = require('../utils/botMessenger');

// --- Konfigurasi Anti-Spam ---
const antiSpam = new Map();
const SPAM_COOLDOWN = 5000; 

// --- Konfigurasi Filter Pesan Lama ---
const MESSAGE_AGE_THRESHOLD = 60 * 1000; 

const commands = new Map();

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
    // Abaikan pesan yang dikirim oleh bot itu sendiri
    if (msg.key.fromMe) return; 

    // Abaikan pesan yang terlalu tua
    const messageTimestampMs = parseInt(msg.messageTimestamp) * 1000;
    if (Date.now() - messageTimestampMs > MESSAGE_AGE_THRESHOLD) {
        logger.info(`[FILTER] Mengabaikan pesan lama dari ${msg.key.remoteJid} (timestamp: ${msg.messageTimestamp})`);
        return;
    }

    const { message, key } = msg;
    const text = message?.conversation || message?.extendedTextMessage?.text || '';
    const senderJid = key.participant || key.remoteJid;
    const groupJid = key.remoteJid;
    const config = await db.readData('config'); // Pastikan config dibaca di sini
    const groupsData = await db.readData('groups'); // Pastikan groupsData dibaca di sini
    const senderName = msg.pushName || senderJid.split('@')[0]; 

    // <<< TAMBAH LOG UNTUK SEMUA PESAN GRUP DI SINI >>>
    if (groupJid.endsWith('@g.us')) {
        const groupCategory = config.groups[groupJid] || 'undefined/not-listed'; // Mengambil kategori grup, fallback jika tidak ada
        // Hapus console.log debug yang lama
        // console.log(`[DEBUG] Pesan dari Grup ID: ${groupJid}`); 
        // console.log(`[DEBUG] Kategori Grup terdeteksi: ${groupCategory}`);

        // Log pesan grup dalam format yang diminta
        logger.info(`[PESAN_GRUP] Pesan dari ${senderName} (${senderJid.split('@')[0]}): '${text}', dari grup ID: ${groupJid}, Kategori: ${groupCategory}`);
    }
    // <<< AKHIR TAMBAHAN >>>

    // Cek status On/Off bot (global)
    if (!botState.isActive() && !text.startsWith('!on')) {
        return;
    }

    // Filter Grup: Hanya merespons di grup yang tidak diblokir atau tidak ada di config.groups
    const groupCategory = config.groups[groupJid]; // Mengambil ulang kategori grup (untuk logika filter ini)
    if (groupJid.endsWith('@g.us') && (!groupCategory || groupCategory === 'blocked')) {
        if (!text.startsWith('!on')) {
            return;
        }
    }

    // Logika Pemberian XP
    if (groupJid.endsWith('@g.us') && groupCategory && groupCategory !== 'blocked') {
        incrementActivity(senderJid);
    }
    
    const args = text.slice(1).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    const command = commands.get(commandName);

    const userRole = config.owner.includes(senderJid) ? 'owner' :
                     config.developers.includes(senderJid) ? 'developer' :
                     config.admins.includes(senderJid) ? 'admin' : 'user';

    if (text.startsWith('!')) {
        if (userRole !== 'owner' && userRole !== 'developer') {
            const now = Date.now();
            const lastCommandTime = antiSpam.get(senderJid);

            if (lastCommandTime) {
                const timeDiff = now - lastCommandTime;
                if (timeDiff < SPAM_COOLDOWN) {
                    logger.warn({ sender: senderJid, command: commandName }, 'Aksi spam terdeteksi.');
                    await botMessenger.sendBotMessage(msg.key.remoteJid, { text: `⚠️ Anda terlalu cepat! Mohon tunggu beberapa detik sebelum menggunakan perintah lagi.` }, { quoted: msg });
                    return; 
                }
            }
            antiSpam.set(senderJid, now);
        }

        if (!command) {
            return;
        }

        if (command.category === 'admin' && !['owner', 'developer', 'admin'].includes(userRole)) {
            await botMessenger.sendBotMessage(msg.key.remoteJid, { text: '⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.' }, { quoted: msg });
            return;
        }

        try {
            const from = senderJid.split('@')[0];
            const groupInfoLog = groupJid.endsWith('@g.us') ? `Grup (${groupJid.slice(0, 9)}...)` : 'DM';
            logger.info({ from, in: groupInfoLog, command: text }, `Perintah diterima`);
            
            await command.execute(sock, msg, args, userRole); 
        } catch (error) {
            logger.error({ err: error, command: commandName }, `Error tidak tertangani pada handler utama`);
            await botMessenger.sendBotMessage(msg.key.remoteJid, { text: `Maaf, terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
        return;
    }

    if (groupJid.endsWith('@g.us')) {
        let groupConfig = groupsData[groupJid];
        if (!groupConfig) {
            groupConfig = { 
                groupChatHistory: [], 
                rpModeEnabled: false, 
                welcomeMessage: "Selamat datang, @{tag} di grup kami! Senang Anda bergabung. ", 
                goodbyeMessage: "Sampai jumpa, @{tag}! Kami akan merindukanmu.", 
                goodbyePrivateMessage: "Halo @{tag}, Anda telah keluar dari grup. Semoga hari Anda menyenangkan!", 
                groupInviteLink: "" 
            }; 
            groupsData[groupJid] = groupConfig;
            await db.writeData('groups', groupsData);
        }

        if (!groupConfig.groupChatHistory) {
            groupConfig.groupChatHistory = [];
        }

        let groupChatHistory = groupConfig.groupChatHistory;

        if (groupConfig.rpModeEnabled && text.toLowerCase().includes('pelayan')) {
            console.log(`[RP-BOT] Menerima pesan roleplay dari ${senderJid} di ${groupJid}`);

            groupChatHistory.push({ role: 'user', senderName: senderName, content: text });

            const MAX_HISTORY_LENGTH = 15;
            if (groupChatHistory.length > MAX_HISTORY_LENGTH) {
                groupChatHistory = groupChatHistory.slice(-MAX_HISTORY_LENGTH);
            }

            try {
                const rpResponse = await askSmartAI(text, groupChatHistory, true);

                if (rpResponse && typeof rpResponse.text === 'string' && rpResponse.text.length > 0) {
                    await botMessenger.sendBotMessage(groupJid, { text: rpResponse.text }, { quoted: msg });
                    groupChatHistory.push({ role: 'assistant', content: rpResponse.text });
                    
                    groupConfig.groupChatHistory = groupChatHistory;
                    await db.writeData('groups', groupsData); 
                } else {
                    console.warn(`[RP-BOT] AI gagal memberikan respons atau respons kosong untuk query: "${text}"`);
                }

            } catch (error) {
                console.error(`[RP-BOT] Error saat memanggil AI untuk roleplay:`, error);
            }
        }
    }
};