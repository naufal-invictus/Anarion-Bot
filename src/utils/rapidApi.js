// src/utils/rapidApi.js
const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Fetches Spotify download information from RapidAPI.
 * @param {string} spotifyUrl The Spotify track URL.
 * @returns {Promise<object>} The data object from RapidAPI, or throws an error.
 */
async function fetchSpotifyFromRapidApi(spotifyUrl) {
    const apiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST_SPOTIFY; // Contoh: spotify-downloader9.p.rapidapi.com

    if (!apiKey || !rapidApiHost) {
        throw new Error('RAPIDAPI_KEY atau RAPIDAPI_HOST_SPOTIFY tidak ditemukan di file .env');
    }

    // Ekstrak ID lagu dari URL Spotify
    const trackIdMatch = spotifyUrl.match(/(?:track|playlist|album)\/([a-zA-Z0-9]+)/);
    if (!trackIdMatch || !trackIdMatch[1]) {
        throw new Error('URL Spotify tidak valid. Tidak dapat mengekstrak ID lagu.');
    }
    const spotifyId = trackIdMatch[1];
    
    // Endpoint yang ditemukan dari dokumentasi RapidAPI
    const rapidApiEndpoint = `https://${rapidApiHost}/downloadSong?songId=${encodeURIComponent(spotifyId)}`;

    try {
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': rapidApiHost
            }
        };

        const response = await fetch(rapidApiEndpoint, options);
        const data = await response.json();

        if (data.success && data.data) {
            return data.data; // Mengembalikan objek 'data' dari respons RapidAPI
        } else {
            throw new Error(data.message || 'Gagal mengambil data Spotify dari RapidAPI. Pastikan ID lagu valid.');
        }
    } catch (error) {
        console.error("Error calling RapidAPI (Spotify):", error.message);
        throw new Error(`Terjadi kesalahan saat menghubungi RapidAPI (Spotify): ${error.message}`);
    }
}

module.exports = {
    fetchSpotifyFromRapidApi,
};