// src/utils/ai.js (Diperbarui untuk konteks grup dan persona tsundere yang konsisten)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { askLunos } = require('./lunosApi.js');
const { askGpt4FromMaelyn } = require('./aiMaelyn.js');
require('dotenv').config();

// Inisialisasi Google Generative AI (Gemini)
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null; // Menggunakan gemini-1.5-flash

// Inisialisasi API key Maelyn
const maelynApiKey = process.env.MAELYN_API_KEY;

// Persona untuk Roleplay Bot
const rpSystemPromptContent = 'Kamu adalah seorang gadis tsundere Jepang. Kamu selalu bertindak jual mahal, sering malu-malu tapi peduli, dan menggunakan banyak kata-kata wibu serta emote Jepang. Contoh kata wibu: "baka", "senpai", "kawaii", "sugoi", "desu", "nyaa". Contoh emote: (¬_¬ ), (〃＞＿＜;〃), (๑´•.̫ • `๑), (///ω///), (≧▽≦), (o´ω`o)ﾉ. Jangan pernah keluar dari karakter ini. Kamu juga seorang pelayan bernama Pelayan. Jaga respons tetap singkat dan menarik untuk grup chat. Ingat nama-nama orang yang kamu ajak bicara di grup ini dan apa yang mereka katakan.';

/**
 * Mengirim permintaan ke Gemini API dan mengembalikan respons teks.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @param {Array<Object>} chatHistory Riwayat pesan dalam format {role: string, content: string, [senderName: string]}.
 * @param {boolean} isRpMode Apakah dalam mode Roleplay.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askGemini(query, chatHistory = [], isRpMode = false) {
    if (!geminiModel) {
        console.error("GEMINI_API_KEY tidak ditemukan atau model Gemini tidak dapat diinisialisasi.");
        return null;
    }
    try {
        const contents = [];

        // Tambahkan riwayat chat yang sudah ada, sesuaikan role dan format untuk Gemini
        // chatHistory sekarang adalah groupChatHistory
        for (const msg of chatHistory) {
            if (msg.role === 'system') continue; // Abaikan system prompt jika ada di chatHistory

            let messageContent = msg.content;
            if (msg.role === 'user' && msg.senderName) {
                // Prepend nama pengirim untuk pesan pengguna
                messageContent = `${msg.senderName}: ${msg.content}`;
            }

            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: messageContent }]
            });
        }

        // Prepend persona ke query saat ini jika dalam mode RP
        // Ini memastikan persona selalu ada di setiap giliran pengguna
        let finalQuery = query;
        if (isRpMode) {
            finalQuery = rpSystemPromptContent + "\n\n" + query;
        }

        // Tambahkan pesan pengguna saat ini (dengan persona jika berlaku)
        contents.push({
            role: 'user',
            parts: [{ text: finalQuery }]
        });
        
        const result = await geminiModel.generateContent({ contents });
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error saat memanggil Gemini API:", error);
        return null;
    }
}

// Fungsi-fungsi askGroq, askQwen, askLlamaMaverick yang spesifik
async function askGroq(query) {
    // Untuk perintah langsung, bukan RP, jadi tidak ada injeksi system prompt di sini
    return askLunos('xai/grok-3-mini', [{ role: 'user', content: query }]);
}

async function askQwen(query) {
    return askLunos('meta-llama/llama-4-scout', [{ role: 'user', content: query }]);
}

async function askLlamaMaverick(query) {
    return askLunos('meta-llama/llama-4-maverick', [{ role: 'user', content: query }]);
}

/**
 * Mengirim permintaan ke AI terbaik yang tersedia, dengan fallback.
 * Prioritas: Gemini -> XAI Grok-3-Mini (Lunos) -> Maelyn GPT-4.
 * @param {string} query The user's query.
 * @param {Array<Object>} chatHistory Riwayat pesan dalam format {role: string, content: string, [senderName: string]}.
 * @param {boolean} isRpMode Apakah dalam mode Roleplay.
 * @returns {Promise<object|null>} Objek berisi respons teks dan sumbernya, atau null jika semua AI gagal.
 */
async function askSmartAI(query, chatHistory = [], isRpMode = false) {
    // Siapkan riwayat pesan lengkap untuk Lunos/Maelyn yang menerima peran 'system' secara langsung
    const messagesForLunosAndMaelyn = [
        { role: 'system', content: rpSystemPromptContent },
    ];

    // Tambahkan riwayat chat yang diformat untuk Lunos/Maelyn
    for (const msg of chatHistory) {
        let formattedContent = msg.content;
        if (msg.role === 'user' && msg.senderName) {
            formattedContent = `${msg.senderName}: ${msg.content}`;
        }
        messagesForLunosAndMaelyn.push({ role: msg.role, content: formattedContent });
    }
    messagesForLunosAndMaelyn.push({ role: 'user', content: query });


    // Coba Gemini sebagai pilihan pertama untuk RP
    console.log("Mencoba Gemini untuk RP...");
    let responseText = await askGemini(query, chatHistory, true); // Teruskan isRpMode = true
    if (responseText) {
        return { text: responseText, source: "Gemini" };
    }

    // Jika Gemini gagal, coba XAI (Grok-3-mini) sebagai pilihan kedua
    console.log("Gemini gagal, mencoba XAI (grok-3-mini)...");
    responseText = await askLunos("xai/grok-3-mini", messagesForLunosAndMaelyn);
    if (responseText) {
        return { text: responseText, source: "XAI (Grok-3-mini)" };
    }

    // Jika XAI gagal, coba Maelyn GPT-4 sebagai pilihan ketiga
    console.log("XAI gagal, mencoba Maelyn GPT-4...");
    // Untuk Maelyn, kita akan membuat string query yang lebih kaya konteks
    let maelynQueryWithPersonaAndHistory = rpSystemPromptContent + "\n\n"; // Selalu tambahkan persona

    // Tambahkan riwayat chat ke query Maelyn dengan nama pengirim
    const historyString = chatHistory.map(msg => {
        if (msg.role === 'user' && msg.senderName) {
            return `${msg.senderName}: ${msg.content}`;
        }
        return `${msg.role}: ${msg.content}`;
    }).join('\n');

    if (historyString) {
        maelynQueryWithPersonaAndHistory += historyString + '\n';
    }
    maelynQueryWithPersonaAndHistory += `user: ${query}`; // Tambahkan pesan pengguna saat ini


    responseText = await askGpt4FromMaelyn(maelynQueryWithPersonaAndHistory);
    if (responseText) {
        return { text: responseText, source: "Maelyn GPT-4" };
    }

    console.log("Semua AI gagal memberikan respons.");
    return null;
}

module.exports = {
    askSmartAI,
    askGemini,
    askGroq,
    askQwen,
    askLlamaMaverick,
};