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
 * @param {Array<Object>} messages Array pesan dalam format {role: string, content: string}.
 * @param {number} [temperature] Nilai temperatur untuk respons AI (default: 1.5).
 * @param {number} [topP] Nilai top_p untuk respons AI (default: undefined/API default).
 * @returns {Promise<string>} Respons teks dari AI.
 */
async function askLunos(modelName, messages, temperature = 1.5, topP = undefined) {
    if (!LUNOS_API_KEY) {
        throw new Error('LUNOS_API_KEY tidak ditemukan di file .env');
    }

    try {
        const completion = await openai.chat.completions.create({
            model: modelName,
            messages: messages,
            temperature: temperature,
            top_p: topP // Tambahkan top_p di sini
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