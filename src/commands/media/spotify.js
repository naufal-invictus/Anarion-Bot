// src/commands/media/spotify.js
const { fetchSpotifyFromMaelyn } = require('../../utils/aiMaelyn.js');
const { fetchSpotifyFromRapidApi } = require('../../utils/rapidApi.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'spotify',
    category: 'media',
    description: 'Mengunduh lagu dari Spotify (MP3).',
    execute: async (sock, msg, args) => {
        const spotifyUrl = args[0];
        if (!spotifyUrl) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan URL lagu Spotify.\nContoh: `!spotify <link_lagu_spotify>`' }, { quoted: msg });
        }

        let result = null;
        let apiSource = 'Maelyn API';

        try {
            await sendBotMessage(msg.key.remoteJid, { text: '⏳ Sedang mencoba mengunduh dari Maelyn API, mohon tunggu...' }, { quoted: msg });
            result = await fetchSpotifyFromMaelyn(spotifyUrl);
        } catch (melynError) {
            console.error("Maelyn API failed, trying RapidAPI:", melynError.message);
            apiSource = 'RapidAPI';
            try {
                await sendBotMessage(msg.key.remoteJid, { text: '⏳ Maelyn API gagal, mencoba RapidAPI, mohon tunggu...' }, { quoted: msg });
                result = await fetchSpotifyFromRapidApi(spotifyUrl);
            } catch (rapidApiError) {
                console.error("RapidAPI also failed:", rapidApiError.message);
                return sendBotMessage(msg.key.remoteJid, { text: `❌ Gagal mengunduh lagu Spotify dari kedua API. Pastikan URL valid dan coba lagi nanti.\nError: ${rapidApiError.message}` }, { quoted: msg });
            }
        }

        if (result) {
            let title, artists, albumName, coverUrl, downloadLink;

            if (apiSource === 'Maelyn API') {
                title = result.title;
                artists = result.artists.join(', ');
                albumName = result.album?.name || 'Tidak Diketahui';
                coverUrl = result.album?.images?.[0]?.url;
                downloadLink = result.preview_url; // Maelyn often provides a preview_url
            } else { // RapidAPI
                title = result.title;
                artists = result.artist; // RapidAPI provides 'artist' as a string
                albumName = result.album;
                coverUrl = result.cover;
                downloadLink = result.downloadLink;
            }

            let caption = `*🎶 Berhasil Mengunduh Lagu Spotify*\n\n`;
            caption += `*Judul:* ${title || 'Tidak Diketahui'}\n`;
            caption += `*Artis:* ${artists || 'Tidak Diketahui'}\n`;
            caption += `*Album:* ${albumName || 'Tidak Diketahui'}\n`;
            caption += `*Sumber API:* ${apiSource}\n\n`;
            
            if (downloadLink) {
                 caption += `*Link Unduh:* ${downloadLink}\n`;
            } else {
                 caption += `_Tidak ada link unduh langsung yang tersedia._\n`;
            }
            
            if (coverUrl) {
                await sendBotMessage(msg.key.remoteJid, {
                    image: { url: coverUrl },
                    caption: caption,
                }, { quoted: msg });
            } else {
                await sendBotMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });
            }

            // Send the audio if a download link is available
            if (downloadLink) {
                await sendBotMessage(msg.key.remoteJid, {
                    audio: { url: downloadLink },
                    mimetype: 'audio/mpeg', // Assuming MP3, adjust if different
                    ptt: false, // Set to true if you want to send as voice note
                    fileName: `${title || 'spotify'}.mp3`
                }, { quoted: msg });
            }
            
        } else {
            await sendBotMessage(msg.key.remoteJid, { text: '❌ Terjadi kesalahan tidak diketahui saat memproses lagu Spotify.' }, { quoted: msg });
        }
    },
};