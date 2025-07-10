// src/utils/aiAlibaba.js
const OpenAI = require("openai");
require('dotenv').config();

const getOpenAIClient = () => {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        throw new Error('DASHSCOPE_API_KEY tidak ditemukan di file .env. Silakan tambahkan kunci API Alibaba DashScope Anda.');
    }
    return new OpenAI({
        apiKey: apiKey,
        baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    });
};

/**
 * Bertanya kepada Alibaba Qwen Turbo AI.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwenTurbo(query) {
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: "qwen-turbo",
            messages: [{ "role": "user", "content": query }],
            top_p: 0.8,
            temperature: 0.7
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Alibaba Qwen Turbo API:", error);
        throw new Error(`Gagal mendapatkan respons dari Qwen Turbo: ${error.message || error}`);
    }
}

/**
 * Bertanya kepada Alibaba Qwen 3 AI (menggunakan qwen-turbo sebagai placeholder jika 'qwen3-14b' bukan model langsung).
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwen3(query) {
    // Asumsi 'qwen3-14b' mungkin adalah alias atau model spesifik.
    // Jika tidak ada model langsung 'qwen3-14b', kita bisa menggunakan 'qwen-turbo' atau 'qwen-plus'
    // Untuk demo ini, saya akan menggunakan 'qwen-turbo' sebagai fallback atau Anda bisa ganti ke 'qwen-plus' jika tersedia.
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: "qwen-turbo", // Ganti dengan "qwen3-14b" jika itu nama model yang valid
            messages: [{ "role": "user", "content": query }],
            top_p: 0.8,
            temperature: 0.7
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Alibaba Qwen 3 AI:", error);
        throw new Error(`Gagal mendapatkan respons dari Qwen 3: ${error.message || error}`);
    }
}

/**
 * Bertanya kepada Alibaba Qwen Max AI.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwenMax(query) {
    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: "qwen-max",
            messages: [{ "role": "user", "content": query }],
            top_p: 0.8,
            temperature: 0.7
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Alibaba Qwen Max AI:", error);
        throw new Error(`Gagal mendapatkan respons dari Qwen Max: ${error.message || error}`);
    }
}

module.exports = {
    askQwenTurbo,
    askQwen3,
    askQwenMax,
};