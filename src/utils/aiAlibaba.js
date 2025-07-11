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
 * @param {string} [systemPrompt] Prompt sistem opsional untuk AI.
 * @param {number} [temperature] Nilai temperatur untuk respons AI (default: 0.7).
 * @param {number} [topP] Nilai top_p untuk respons AI (default: 0.8).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwenTurbo(query, systemPrompt, temperature = 0.7, topP = 0.8) {
    try {
        const openai = getOpenAIClient();
        const messages = [];
        if (systemPrompt) {
            messages.push({ "role": "system", "content": systemPrompt });
        }
        messages.push({ "role": "user", "content": query });

        const completion = await openai.chat.completions.create({
            model: "qwen-turbo",
            messages: messages,
            top_p: topP,
            temperature: temperature
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
 * @param {string} [systemPrompt] Prompt sistem opsional untuk AI.
 * @param {number} [temperature] Nilai temperatur untuk respons AI (default: 0.7).
 * @param {number} [topP] Nilai top_p untuk respons AI (default: 0.8).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwen3(query, systemPrompt, temperature = 0.7, topP = 0.8) {
    try {
        const openai = getOpenAIClient();
        const messages = [];
        if (systemPrompt) {
            messages.push({ "role": "system", "content": systemPrompt });
        }
        messages.push({ "role": "user", "content": query });

        const completion = await openai.chat.completions.create({
            model: "qwen-turbo", // Ganti dengan "qwen3-14b" jika itu nama model yang valid
            messages: messages,
            top_p: topP,
            temperature: temperature
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
 * @param {string} [systemPrompt] Prompt sistem opsional untuk AI.
 * @param {number} [temperature] Nilai temperatur untuk respons AI (default: 0.7).
 * @param {number} [topP] Nilai top_p untuk respons AI (default: 0.8).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askQwenMax(query, systemPrompt, temperature = 0.7, topP = 0.8) {
    try {
        const openai = getOpenAIClient();
        const messages = [];
        if (systemPrompt) {
            messages.push({ "role": "system", "content": systemPrompt });
        }
        messages.push({ "role": "user", "content": query });

        const completion = await openai.chat.completions.create({
            model: "qwen-max",
            messages: messages,
            top_p: topP,
            temperature: temperature
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