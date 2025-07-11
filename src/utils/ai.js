// src/utils/ai.js (Diperbarui untuk konteks grup dan persona tsundere yang konsisten)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { askLunos } = require('./lunosApi.js');
const { askGpt4FromMaelyn } = require('./aiMaelyn.js');
require('dotenv').config();

// Inisialisasi Google Generative AI (Gemini)
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
// Menggunakan gemini-1.5-flash karena gemini-2.0-flash tidak valid
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null; 

// Inisialisasi API key Maelyn
const maelynApiKey = process.env.MAELYN_API_KEY;

// Persona untuk Roleplay Bot
// PERUBAHAN DI SINI: Tambahkan instruksi untuk respons singkat
const rpSystemPromptContent = 'Kamu adalah seorang gadis tsundere wibu. Kamu selalu bertindak jual mahal, sering malu-malu tapi peduli, dan menggunakan banyak kata-kata wibu serta emote. Contoh kata wibu: "baka", "senpai", "kawaii", "sugoi", "desu", "nyaa". Contoh emote: (¬_¬ ), (〃＞＿＜;〃), (๑´•.̫ • `๑), (///ω///), (≧▽≦), (o´ω`o)ﾉ. Jangan pernah keluar dari karakter ini. Kamu juga seorang pelayan bernama Pelayan. **Jaga respons tetap singkat, padat.**';

/**
 * Mengirim permintaan ke Gemini API dan mengembalikan respons teks.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @param {Array<Object>} chatHistory Riwayat pesan dalam format {role: string, content: string, [senderName: string]}.
 * @param {boolean} isRpMode Apakah dalam mode Roleplay.
 * @param {number} [temperature] Nilai temperatur untuk respons AI (default: 0.9).
 * @param {number} [topP] Nilai top_p untuk respons AI (default: 1.0).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askGemini(query, chatHistory = [], isRpMode = false, temperature = 0.9, topP = 1.0) {
    if (!geminiModel) {
        console.error("GEMINI_API_KEY tidak ditemukan atau model Gemini tidak dapat diinisialisasi.");
        return null;
    }
    try {
        const contents = [];

        // Tambahkan riwayat chat yang sudah ada, sesuaikan role dan format untuk Gemini
        for (const msg of chatHistory) {
            if (msg.role === 'system') continue;

            let messageContent = msg.content;
            if (msg.role === 'user' && msg.senderName) {
                messageContent = `${msg.senderName}: ${msg.content}`;
            }

            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: messageContent }]
            });
        }

        let finalQuery = query;
        if (isRpMode) {
            finalQuery = rpSystemPromptContent + "\n\n" + query;
        }

        contents.push({
            role: 'user',
            parts: [{ text: finalQuery }]
        });
        
        const result = await geminiModel.generateContent({
            contents,
            generationConfig: {
                temperature: temperature,
                topP: topP,
            },
        });
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error saat memanggil Gemini API:", error);
        return null;
    }
}

// Fungsi-fungsi askGroq, askQwen, askLlamaMaverick yang spesifik
// Mereka sekarang juga menerima temp dan top_p
async function askGroq(query, temperature = 1.0, topP = 1.0) {
    return askLunos('xai/grok-3-mini', [{ role: 'user', content: query }], temperature, topP);
}

async function askQwen(query, temperature = 1.0, topP = 1.0) {
    return askLunos('meta-llama/llama-4-scout', [{ role: 'user', content: query }], temperature, topP);
}

async function askLlamaMaverick(query, temperature = 1.0, topP = 1.0) {
    return askLunos('meta-llama/llama-4-maverick', [{ role: 'user', content: query }], temperature, topP);
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
    const RP_TEMPERATURE = 1.0;
    const RP_TOP_P = 0.95;

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
    // PENTING: Teruskan temperature dan topP di sini untuk Gemini RP
    let responseText = await askGemini(query, chatHistory, true, RP_TEMPERATURE, RP_TOP_P);
    if (responseText) {
        return { text: responseText, source: "Gemini" };
    }

    // Jika Gemini gagal, coba XAI (Grok-3-mini) sebagai pilihan kedua
    console.log("Gemini gagal, mencoba XAI (grok-3-mini)...");
    // PENTING: Teruskan temperature dan topP di sini untuk Lunos RP
    responseText = await askLunos("xai/grok-3-mini", messagesForLunosAndMaelyn, RP_TEMPERATURE, RP_TOP_P);
    if (responseText) {
        return { text: responseText, source: "XAI (Grok-3-mini)" };
    }

    // Jika XAI gagal, coba Maelyn GPT-4 sebagai pilihan ketiga
    console.log("XAI gagal, mencoba Maelyn GPT-4...");
    // Untuk Maelyn, kita akan membuat string query yang lebih kaya konteks
    let maelynQueryWithPersonaAndHistory = rpSystemPromptContent + "\n\n";

    const historyString = chatHistory.map(msg => {
        if (msg.role === 'user' && msg.senderName) {
            return `${msg.senderName}: ${msg.content}`;
        }
        return `${msg.role}: ${msg.content}`;
    }).join('\n');

    if (historyString) {
        maelynQueryWithPersonaAndHistory += historyString + '\n';
    }
    maelynQueryWithPersonaAndHistory += `user: ${query}`;


    // askGpt4FromMaelyn perlu diubah untuk menerima temperature dan top_p jika API-nya mendukung.
    // Saat ini, tidak ada parameter temp/top_p di askGpt4FromMaelyn.
    // Jika API Maelyn tidak mendukung, ini tidak bisa diatur di sini.
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