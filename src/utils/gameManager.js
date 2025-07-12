// src/utils/gameManager.js
const fs = require('fs-extra');
const path = require('path');
const { updateUserData, getUserData } = require('./leveling.js');
const botMessenger = require('./botMessenger'); // Untuk mengirim pesan bot

const GAME_DATA_PATH = path.join(process.cwd(), 'data', 'game_data.json');
const activeGames = new Map(); // Map untuk menyimpan game aktif: { groupJid: { category, question, answer, timeout, startTime, playerJid } }
const GAME_TIMEOUT_MS = 45 * 1000; // 45 detik

let gameData = {}; // Akan dimuat dari game_data.json

// Fungsi untuk memuat data game
async function loadGameData() {
    try {
        if (fs.existsSync(GAME_DATA_PATH)) {
            gameData = await fs.readJson(GAME_DATA_PATH);
            console.log('✅ Data game berhasil dimuat.');
        } else {
            console.warn('File game_data.json tidak ditemukan. Pastikan Anda telah membuat file ini di folder "data".');
            gameData = {};
        }
    } catch (error) {
        console.error('❌ Gagal memuat game_data.json:', error);
        gameData = {};
    }
}

// Fungsi untuk mendapatkan pertanyaan acak dari kategori tertentu
function getRandomQuestion(category) {
    if (!gameData[category] || gameData[category].length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * gameData[category].length);
    return gameData[category][randomIndex];
}

// Memulai game baru
async function startGame(sock, groupJid, playerJid, category) {
    if (!botMessenger.getClientSock()) {
        console.error("botMessenger belum sepenuhnya siap (sock tidak tersedia) saat mencoba memulai game.");
        await botMessenger.sendBotMessage(groupJid, { text: 'Bot belum siap. Mohon tunggu sebentar.' });
        return false;
    }

    if (activeGames.has(groupJid)) {
        await botMessenger.sendBotMessage(groupJid, { text: '❌ Ada game lain yang sedang berjalan di grup ini. Selesaikan dulu atau ketik `!menyerahgame`.' });
        return false;
    }

    const questionData = getRandomQuestion(category);
    if (!questionData) {
        await botMessenger.sendBotMessage(groupJid, { text: `Maaf, tidak ada pertanyaan untuk kategori '${category}' saat ini. Silakan hubungi admin untuk menambahkan pertanyaan.` });
        return false;
    }

    const questionText = `*───「 Game ${category.toUpperCase()} Dimulai! 」───*\n\nPertanyaan:\n*${questionData.question}*\n\n_Waktu: 45 detik. Jawab dengan !jawab [jawaban Anda]_`;

    await botMessenger.sendBotMessage(groupJid, { text: questionText });

    const timeout = setTimeout(async () => {
        const game = activeGames.get(groupJid);
        if (game && game.playerJid === playerJid) {
            // Panggil updateGameStats SEBELUM endGame
            updateGameStats(playerJid, false); // Dianggap kalah karena waktu habis
            await botMessenger.sendBotMessage(groupJid, { text: `⏰ Waktu habis! Game berakhir. Jawaban yang benar adalah: *${game.displayAnswer}*` }); // Gunakan displayAnswer
            endGame(groupJid); // Akhiri game setelah update stats
        }
    }, GAME_TIMEOUT_MS);

    // Simpan semua alias jawaban dalam lowercase untuk perbandingan
    const processedAnswers = questionData.answer.map(ans => ans.toLowerCase().trim());
    // Simpan jawaban utama untuk ditampilkan jika game berakhir
    const displayAnswer = questionData.answer[0]; 

    activeGames.set(groupJid, {
        category: category,
        question: questionData.question,
        answer: processedAnswers, // Sekarang ini adalah array alias dalam lowercase
        displayAnswer: displayAnswer, // Jawaban yang akan ditampilkan ke pengguna
        timeout: timeout,
        startTime: Date.now(),
        playerJid: playerJid // Pencatat pemain yang memulai atau sedang aktif dalam game
    });

    console.log(`[GAME] Game ${category} dimulai di ${groupJid} oleh ${playerJid}`);
    return true;
}

// Memproses jawaban pemain
async function processAnswer(groupJid, playerJid, userAnswer) {
    const game = activeGames.get(groupJid);

    if (!game) {
        await botMessenger.sendBotMessage(groupJid, { text: '❌ Tidak ada game yang sedang berjalan di sini.' });
        return;
    }

    // Pastikan hanya pemain yang memulai game atau sedang aktif yang bisa menjawab
    if (game.playerJid !== playerJid) {
        await botMessenger.sendBotMessage(groupJid, { text: `Maaf, game ini dimulai oleh @${game.playerJid.split('@')[0]}. Hanya dia yang bisa menjawab.` , mentions: [game.playerJid]});
        return;
    }

    const cleanedAnswer = userAnswer.toLowerCase().trim(); // Konversi ke huruf kecil dan hapus spasi di awal/akhir

    // Periksa apakah jawaban pengguna ada di dalam array alias
    if (game.answer.includes(cleanedAnswer)) {
        await botMessenger.sendBotMessage(groupJid, { text: `🎉 Selamat @${playerJid.split('@')[0]}! Jawaban Anda benar! Anda mendapatkan 120 XP.`, mentions: [playerJid] });
        updateGameStats(playerJid, true); // Menang
        endGame(groupJid); 
    } else {
        await botMessenger.sendBotMessage(groupJid, { text: `😞 Maaf, jawaban Anda salah. Anda kehilangan 100 XP.`, mentions: [playerJid] });
        updateGameStats(playerJid, false); // Kalah
        // Game TIDAK berakhir jika jawaban salah
    }
}

// Mengakhiri game (secara manual atau otomatis)
function endGame(groupJid) {
    const game = activeGames.get(groupJid);
    if (game) {
        clearTimeout(game.timeout);
        activeGames.delete(groupJid);
        console.log(`[GAME] Game di ${groupJid} diakhiri.`);
    }
}

// Mengakhiri game secara manual oleh pemain
async function surrenderGame(groupJid, playerJid) {
    const game = activeGames.get(groupJid);
    if (game && game.playerJid === playerJid) {
        clearTimeout(game.timeout);
        activeGames.delete(groupJid);
        await botMessenger.sendBotMessage(groupJid, { text: `😭 @${playerJid.split('@')[0]} menyerah! Game diakhiri. Jawaban yang benar adalah *${game.displayAnswer}*. Anda kehilangan 100 XP.`, mentions: [playerJid] }); // Gunakan displayAnswer
        console.log(`[GAME] Game di ${groupJid} diserahkan oleh ${playerJid}.`);
        updateGameStats(playerJid, false); // Dianggap kalah karena menyerah
    } else {
        await botMessenger.sendBotMessage(groupJid, { text: 'Tidak ada game yang sedang berjalan yang Anda mulai di grup ini.' });
    }
}

// Memperbarui statistik game pengguna dan XP
function updateGameStats(jid, isWin) {
    const userData = getUserData(jid);
    
    // PENTING: Pastikan gameStats diinisialisasi di sini sebelum digunakan.
    // getUserData dari leveling.js sudah memanggil ensureUserData,
    // jadi userData.gameStats seharusnya sudah objek.
    // Cek ini sebagai lapisan keamanan terakhir.
    if (!userData.gameStats || typeof userData.gameStats !== 'object') {
        console.error(`[UPDATE_GAME_STATS_ERROR] gameStats tidak valid untuk JID: ${jid}. Menginisialisasi ulang.`);
        userData.gameStats = { played: 0, won: 0, lost: 0 };
    }
    
    userData.gameStats.played += 1;
    if (isWin) {
        userData.gameStats.won += 1;
        userData.xp = (userData.xp || 0) + 120;
    } else {
        userData.gameStats.lost += 1;
        userData.xp = (userData.xp || 0) - 100;
        if (userData.xp < 0) userData.xp = 0; // Pastikan XP tidak negatif
    }
    
    // Perbarui level berdasarkan XP baru
    userData.level = Math.floor(0.1 * Math.sqrt(userData.xp));

    updateUserData(jid, userData); // Simpan perubahan ke file users.json
    console.log(`[GAME_STATS] Stats untuk ${jid}: Played: ${userData.gameStats.played}, Won: ${userData.gameStats.won}, Lost: ${userData.gameStats.lost}, XP: ${userData.xp}`);
}

module.exports = {
    startGame,
    processAnswer,
    surrenderGame,
    loadGameData // Diekspor agar bisa dipanggil setelah botMessenger siap
};