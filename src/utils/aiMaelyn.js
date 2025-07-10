// src/utils/aiMaelyn.js
const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Fetches media information from Maelyn API (allinone endpoint).
 * Used by !mp3 and !mp4 commands.
 * @param {string} urlSosmed The social media URL to process.
 * @returns {Promise<object>} The result object from Maelyn API, or throws an error.
 */
async function fetchMediaFromMaelyn(urlSosmed) {
    const apiKey = process.env.MAELYN_API_KEY;
    if (!apiKey) {
        throw new Error('MAELYN_API_KEY tidak ditemukan di file .env');
    }

    const apiUrl = `https://api.maelyn.sbs/api/allinone?url=${encodeURIComponent(urlSosmed)}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "mg-apikey": apiKey
            }
        });

        const data = await response.json();

        if (data.status === "Success" && data.result) {
            return data.result;
        } else {
            throw new Error(data.message || 'Gagal mengambil data dari Maelyn API (allinone).');
        }
    } catch (error) {
        console.error("Error calling Maelyn API (allinone):", error.message);
        throw new Error(`Terjadi kesalahan saat menghubungi API Maelyn (allinone): ${error.message}`);
    }
}

/**
 * Fetches Spotify download information from Maelyn API.
 * Used by !spotify command.
 * @param {string} spotifyUrl The Spotify track URL.
 * @returns {Promise<object>} The result object from Maelyn Spotify API, or throws an error.
 */
async function fetchSpotifyFromMaelyn(spotifyUrl) {
    const apiKey = process.env.MAELYN_API_KEY;
    if (!apiKey) {
        throw new Error('MAELYN_API_KEY tidak ditemukan di file .env');
    }

    const apiUrl = `https://api.maelyn.sbs/api/spotify/download?url=${encodeURIComponent(spotifyUrl)}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "mg-apikey": apiKey
            }
        });

        const data = await response.json();

        if (data.status === "Success" && data.result) {
            return data.result;
        } else {
            throw new Error(data.message || 'Gagal mengambil data Spotify dari Maelyn API. Pastikan URL valid.');
        }
    } catch (error) {
        console.error("Error calling Maelyn API (Spotify):", error.message);
        throw new Error(`Terjadi kesalahan saat menghubungi API Maelyn (Spotify): ${error.message}`);
    }
}

/**
 * Fetches TikTok download information from Maelyn API.
 * Used by !tiktok command.
 * @param {string} tiktokUrl The TikTok video/audio/image URL.
 * @returns {Promise<object>} The result object from Maelyn TikTok API, or throws an error.
 */
async function fetchTiktokFromMaelyn(tiktokUrl) {
    const apiKey = process.env.MAELYN_API_KEY;
    if (!apiKey) {
        throw new Error('MAELYN_API_KEY tidak ditemukan di file .env');
    }

    const apiUrl = `https://api.maelyn.sbs/api/tiktok/download?url=${encodeURIComponent(tiktokUrl)}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "mg-apikey": apiKey
            }
        });

        const data = await response.json();

        if (data.status === "Success" && data.result) {
            return data.result;
        } else {
            throw new Error(data.message || 'Gagal mengambil data TikTok dari Maelyn API. Pastikan URL valid dan publik.');
        }
    } catch (error) {
        console.error("Error calling Maelyn API (TikTok):", error.message);
        throw new Error(`Terjadi kesalahan saat menghubungi API Maelyn (TikTok): ${error.message}`);
    }
}

/**
 * Asks GPT-4 via Maelyn API.
 * Used by !gpt4 command.
 * @param {string} query The question or prompt for the AI.
 * @returns {Promise<string>} Text response from the AI.
 */
async function askGpt4FromMaelyn(query) {
    const apiKey = process.env.MAELYN_API_KEY;
    if (!apiKey) {
        throw new Error('MAELYN_API_KEY tidak ditemukan di file .env');
    }

    const apiUrl = `https://api.maelyn.sbs/api/chatgpt?q=${encodeURIComponent(query)}&model=gpt-4`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "mg-apikey": apiKey
            }
        });

        const data = await response.json();

        if (data.status === "Success" && data.result) {
            return data.result;
        } else {
            throw new Error(data.message || 'Gagal mendapatkan respons dari GPT-4 melalui Maelyn API.');
        }
    } catch (error) {
        console.error("Error calling Maelyn API (GPT-4):", error.message);
        throw new Error(`Terjadi kesalahan saat menghubungi API Maelyn (GPT-4): ${error.message}`);
    }
}

module.exports = {
    fetchMediaFromMaelyn,
    fetchSpotifyFromMaelyn,
    fetchTiktokFromMaelyn,
    askGpt4FromMaelyn,
};