// src/handlers/messageHandler.js (Perbaikan untuk ReferenceError)
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

const processingRp = new Set(); // Melacak grup mana yang sedang diproses RP-nya
const rpCooldowns = new Map(); // Menyimpan waktu cooldown untuk setiap grup

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
    const config = await db.readData('config');
    const groupsData = await db.readData('groups');
    const senderName = msg.pushName || senderJid.split('@')[0]; 

    // Log pesan grup
    if (groupJid.endsWith('@g.us')) {
        const groupCategory = config.groups[groupJid] || 'undefined/not-listed';
        logger.info(`[PESAN_GRUP] Pesan dari ${senderName} (${senderJid.split('@')[0]}): '${text}', dari grup ID: ${groupJid}, Kategori: ${groupCategory}`);
    }

    // Cek status On/Off bot (global)
    if (!botState.isActive() && !text.startsWith('!on')) {
        return;
    }

    // Filter Grup: Hanya merespons di grup yang tidak diblokir
    const groupCategory = config.groups[groupJid];
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

        // Pastikan groupChatHistory terinisialisasi
        if (!groupConfig.groupChatHistory) {
            groupConfig.groupChatHistory = [];
        }

        let groupChatHistory = groupConfig.groupChatHistory;

        // Cek jika pesan berisi kata kunci "pelayan" atau "himari" dan mode roleplay aktif
        if (groupConfig.rpModeEnabled && (text.toLowerCase().includes('pelayan') || text.toLowerCase().includes('himari'))) {
            const now = Date.now();
            const cooldownEnd = rpCooldowns.get(groupJid);

            // 1. Cek apakah grup sedang dalam masa cooldown
            if (cooldownEnd && now < cooldownEnd) {
                logger.info(`[RP-BOT] Cooldown RP aktif di grup ${groupJid}. Pesan diabaikan.`);
                return; // Abaikan pesan secara diam-diam jika cooldown aktif
            }

            // 2. Cek apakah ada permintaan lain yang sedang diproses di grup ini
            if (processingRp.has(groupJid)) {
                logger.warn(`[RP-BOT] Panggilan simultan terdeteksi di grup ${groupJid}. Mengaktifkan cooldown.`);
                
                // Kirim pesan "lelah" sesuai permintaan Anda, dengan gaya Himari
                await botMessenger.sendBotMessage(groupJid, { text: 'Ara ara~ Tuan-tuan semua memanggil Himari bersamaan... Himari jadi capek harus imut terus~ Gomen, Himari mau istirahat sebentar ya... (シ_ _)シ' }, { quoted: msg });
                
                // Atur cooldown selama 30 detik untuk grup ini
                rpCooldowns.set(groupJid, now + 30000); 
                return; // Hentikan pemrosesan untuk panggilan ini
            }

            try {
                // 3. Tandai bahwa grup ini sedang diproses
                processingRp.add(groupJid);

                logger.info(`[RP-BOT] Menerima pesan roleplay   dari ${senderName} di ${groupJid}`);

                let groupChatHistory = groupConfig.groupChatHistory || [];
                groupChatHistory.push({ role: 'user', senderName: senderName, content: text });

                const MAX_HISTORY_LENGTH = 15;
                if (groupChatHistory.length > MAX_HISTORY_LENGTH) {
                    groupChatHistory = groupChatHistory.slice(-MAX_HISTORY_LENGTH);
                }

                const rpGenerationConfig = {
                    temperature: 1,
                    topP: 0.95,
                    maxOutputTokens: 120,
                    topK: 1,
                    seed: 42
                };

                const rpResponse = await askSmartAI(text, senderName, groupChatHistory, true, rpGenerationConfig);

                if (rpResponse && rpResponse.text) {
                    await botMessenger.sendBotMessage(groupJid, { text: rpResponse.text }, { quoted: msg });
                    groupChatHistory.push({ role: 'assistant', content: rpResponse.text });
                    
                    groupConfig.groupChatHistory = groupChatHistory;
                    await db.writeData('groups', groupsData); 
                } else {
                    logger.warn(`[RP-BOT]   AI gagal memberikan respons untuk query: "${text}"`);
                }

            } catch (error) {
                logger.error(`[RP-BOT] Error saat memanggil AI untuk roleplay:`, error);
                await botMessenger.sendBotMessage(groupJid, { text: 'Ara ara~ Himari lagi pusing... Tuan bisa tanya lagi nanti? Gomen ne~ (｡•́︿•̀｡)' }, { quoted: msg });
            } finally {
                // 4. Pastikan untuk selalu menghapus tanda "sedang diproses" setelah selesai
                processingRp.delete(groupJid);
            }
        }
    }
};