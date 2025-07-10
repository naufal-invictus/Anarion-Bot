// src/utils/aiGroq.js
const { Groq } = require('groq-sdk');
require('dotenv').config();

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY tidak ditemukan di file .env. Silakan tambahkan kunci API Groq Anda.');
    }
    return new Groq({ apiKey: apiKey });
};

/**
 * Bertanya kepada Groq LLAMA Versatile AI.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askLlama(query) {
    try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ "role": "user", "content": query }],
            model: "llama-3.3-70b-versatile", // Menggunakan model yang lebih baru jika tersedia
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Groq LLAMA AI:", error);
        throw new Error(`Gagal mendapatkan respons dari LLAMA: ${error.message || error}`);
    }
}

/**
 * Bertanya kepada Groq Deepseek AI.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askDeepseek(query) {
    try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ "role": "user", "content": query }],
            model: "deepseek-r1-distill-llama-70b",
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Groq Deepseek AI:", error);
        throw new Error(`Gagal mendapatkan respons dari Deepseek: ${error.message || error}`);
    }
}

/**
 * Bertanya kepada Groq Gemma AI.
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askGemma(query) {
    try {
        const groq = getGroqClient();
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ "role": "user", "content": query }],
            model: "gemma2-9b-it", // Menggunakan model yang lebih baru jika tersedia
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Groq Gemma AI:", error);
        throw new Error(`Gagal mendapatkan respons dari Gemma: ${error.message || error}`);
    }
}

module.exports = {
    askLlama,
    askDeepseek,
    askGemma,
};