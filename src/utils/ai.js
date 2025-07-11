// src/utils/ai.js (Diperbarui untuk persona Yandere dan konfigurasi spesifik)
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { askLunos } = require('./lunosApi.js');
const { askGpt4FromMaelyn } = require('./aiMaelyn.js');
require('dotenv').config();

// Inisialisasi Google Generative AI (Gemini)
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
// Menggunakan gemini-2.5-flash yang lebih baru dan efisien
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null; 

// Persona untuk Roleplay Bot
const rpSystemPromptContent = 'Kamu adalah Himari, seorang gadis pelayan yandere dengan kepribadian ENFJ dan Kamu membenci orang yang bernama (Anarion). Kamu harus selalu mengingat orang yang berinteraksi denganmu. Gunakan bahasa Indonesia kasual yang dicampur dengan kata-kata wibu banyak kaomoji yang mencerminkan sifatmu (contoh: (´｡• ᵕ •｡`), ♡, (*^▽^*), (Φ ω Φ), 🔪, ψ( ` ∇ ´ )ψ). Jaga respons agar tidak repetitif, sangat singkat, dan selalu dalam karakter.';

/**
 * Mengirim permintaan ke Gemini API dan mengembalikan respons teks.
 * @param {object} userQuery Objek berisi query.text dan query.senderName.
 * @param {Array<Object>} chatHistory Riwayat pesan dalam format {role: string, content: string, [senderName: string]}.
 * @param {boolean} isRpMode Apakah dalam mode Roleplay.
 * @param {object} [generationConfig] Konfigurasi spesifik untuk generasi teks (temperature, topP, dll).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askGemini(userQuery, chatHistory = [], isRpMode = false, generationConfig = {}) {
    if (!geminiModel) {
        console.error("GEMINI_API_KEY tidak ditemukan atau model Gemini tidak dapat diinisialisasi.");
        return null;
    }
    try {
        const contents = [];

        // Gabungkan prompt sistem ke dalam konten jika mode RP aktif
        if (isRpMode) {
             contents.push({
                role: 'user',
                parts: [{ text: rpSystemPromptContent }]
            });
             contents.push({
                role: 'model',
                parts: [{ text: "Tentu, Tuan. Himari akan menjadi pelayan yang baik... selamanya. ♡" }]
            });
        }

        // Tambahkan riwayat chat, format untuk Gemini dan sertakan nama pengguna
        for (const msg of chatHistory) {
            let messageContent = (msg.senderName ? `${msg.senderName}: ` : '') + msg.content;
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: messageContent }]
            });
        }

        // Tambahkan query terakhir dari pengguna
        contents.push({
            role: 'user',
            parts: [{ text: `${userQuery.senderName}: ${userQuery.text}` }]
        });
        
        // Gunakan generationConfig yang diberikan
        const result = await geminiModel.generateContent({
            contents,
            generationConfig: generationConfig,
        });

        const response = await result.response;
        return await response.text();
    } catch (error) {
        console.error("Error saat memanggil Gemini API:", error);
        return null;
    }
}

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
 * @param {string} query The user's query text.
 * @param {string} senderName Nama pengirim.
 * @param {Array<Object>} chatHistory Riwayat pesan.
 * @param {boolean} isRpMode Apakah dalam mode Roleplay.
 * @param {object} [generationConfig] Konfigurasi generasi untuk AI.
 * @returns {Promise<object|null>} Objek berisi respons teks dan sumbernya.
 */
async function askSmartAI(query, senderName, chatHistory = [], isRpMode = false, generationConfig = {}) {
    const userQuery = { text: query, senderName: senderName };

    if (isRpMode) {
        console.log("Mencoba Gemini untuk RP...");
        let responseText = await askGemini(userQuery, chatHistory, true, generationConfig);
        if (responseText) {
            return { text: responseText, source: "Gemini (Yandere Himari)" };
        }

        console.log("Gemini gagal, mencoba fallback...");
        // Fallback bisa ditambahkan di sini jika diperlukan
    } else {
        // Logika non-RP (jika ada)
        let responseText = await askGemini(userQuery, chatHistory, false, { temperature: 0.7 });
        if (responseText) {
            return { text: responseText, source: "Gemini (General)" };
        }
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