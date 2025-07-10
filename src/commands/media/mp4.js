// src/commands/media/mp4.js
const { fetchMediaFromMaelyn } = require('../../utils/aiMaelyn.js'); // Import utilitas baru
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'mp4',
    category: 'media',
    description: 'Mengunduh video MP4 dari URL media sosial.',
    execute: async (sock, msg, args) => {
        const urlSosmed = args[0];
        if (!urlSosmed) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan URL media sosial untuk mengunduh MP4.\nContoh: `!mp4 <link_video_sosmed>`' }, { quoted: msg });
        }

        try {
            const result = await fetchMediaFromMaelyn(urlSosmed); // Gunakan fungsi utilitas

            if (result?.mp4_download_url) {
                const { title, description, thumbnail, mp4_download_url, mp4_file_size, platform } = result;

                let caption = `*\ud83c\udfac Berhasil Mengunduh MP4*\n\n`;
                caption += `*Judul:* ${title || 'Tidak Diketahui'}\n`;
                caption += `*Deskripsi:* ${description || 'Tidak Ada'}\n`;
                caption += `*Platform:* ${platform || 'Tidak Diketahui'}\n`;
                caption += `*Ukuran File:* ${(mp4_file_size / (1024 * 1024)).toFixed(2)} MB\n\n`;
                caption += `*Link Unduh:* ${mp4_download_url}`;

                await sendBotMessage(msg.key.remoteJid, {
                    video: { url: mp4_download_url },
                    caption: caption,
                }, { quoted: msg });
            } else {
                await sendBotMessage(msg.key.remoteJid, { text: `❌ Gagal mengunduh MP4. Video tidak ditemukan atau URL tidak didukung.` }, { quoted: msg });
            }

        } catch (error) {
            console.error("Error in !mp4 command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    },
};