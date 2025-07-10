// src/utils/LunosApi.js
const { OpenAI } = require("openai");
require('dotenv').config();

const LUNOS_API_KEY = process.env.LUNOS_API_KEY;
const LUNOS_BASE_URL = "https://api.lunos.tech/v1";

const openai = new OpenAI({
  apiKey: LUNOS_API_KEY,
  baseURL: LUNOS_BASE_URL,
});

/**
 * Mengirim permintaan ke Lunos API dengan model yang ditentukan.
 * @param {string} modelName Nama model Lunos yang akan digunakan (e.g., "meta-llama/llama-4-scout").
 * @param {string} query Pertanyaan atau prompt untuk AI.
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askLunos(modelName, query) {
    if (!LUNOS_API_KEY) {
        throw new Error('LUNOS_API_KEY tidak ditemukan di file .env');
    }

    try {
        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: query }
            ],
            temperature: 1.5, // Anda bisa menyesuaikan ini
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error(`Error saat memanggil Lunos API untuk model ${modelName}:`, error);
        throw new Error(`Gagal mendapatkan respons dari Lunos API (${modelName}).`);
    }
}

module.exports = {
    askLunos,
};