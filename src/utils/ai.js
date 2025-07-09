const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Inisialisasi model Generative AI dengan API Key dari .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Mengirim permintaan ke Gemini API dan mengembalikan respons teks.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askGemini(query) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY tidak ditemukan di file .env');
    }

    try {
        const result = await model.generateContent(query);
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error saat memanggil Gemini API:", error);
        // Teruskan error agar bisa ditangani oleh file command
        throw new Error("Gagal mendapatkan respons dari Gemini API.");
    }
}

// Fungsi untuk AI lain tetap sebagai placeholder atau bisa diimplementasikan nanti
async function askGroq(query) {
    console.log(`[AI-GROQ] Menerima query: ${query}`);
    return `⚡ Respons dari Groq (Clone): "${query}"`;
}

async function askQwen(query) {
    console.log(`[AI-QWEN] Menerima query: ${query}`);
    return `🎨 Respons dari Qwen (Clone): "${query}"`;
}

module.exports = {
    askGemini,
    askGroq,
    askQwen
};