// src/commands/media/tiktok.js
const { fetchTiktokFromMaelyn } = require('../../utils/aiMaelyn.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'tiktok',
    category: 'media',
    description: 'Mengunduh video, gambar, atau musik dari TikTok.',
    execute: async (sock, msg, args) => {
        const tiktokUrl = args[0];
        if (!tiktokUrl) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan URL TikTok (video/gambar/musik).\nContoh: `!tiktok <link_tiktok>`' }, { quoted: msg });
        }

        try {

            const result = await fetchTiktokFromMaelyn(tiktokUrl);

            const { title, author, video, image_data, music, aweme_id } = result;
            const authorNickname = author?.nickname || 'Tidak Diketahui';
            const postTitle = title || `TikTok dari ${authorNickname}`;

            // Handle Video Download
            if (video?.nwm_url) {
                await sendBotMessage(msg.key.remoteJid, {
                    video: { url: video.nwm_url },
                    caption: `*\ud83c\udfac TikTok Video Berhasil Diunduh!*\n\n*Judul:* ${postTitle}\n*Oleh:* ${authorNickname}\n\n_Video tanpa watermark._`,
                }, { quoted: msg });
                return;
            }

            // Handle Image Slideshow Download
            if (image_data?.no_watermark_image_list && image_data.no_watermark_image_list.length > 0) {
                await sendBotMessage(msg.key.remoteJid, { text: `*\ud83d\udcf8 Mengunduh ${image_data.no_watermark_image_list.length} gambar dari TikTok...*`, }, { quoted: msg });

                for (let i = 0; i < image_data.no_watermark_image_list.length; i++) {
                    const imageUrl = image_data.no_watermark_image_list[i];
                    await sendBotMessage(msg.key.remoteJid, {
                        image: { url: imageUrl },
                        caption: `*Gambar TikTok (${i + 1}/${image_data.no_watermark_image_list.length})*\n\n*Judul:* ${postTitle}\n*Oleh:* ${authorNickname}`,
                    });
                    // Tambahkan jeda kecil untuk mencegah pembatasan laju atau membanjiri pesan
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                return;
            }

            // Handle Music Download
            if (music?.url) {
                await sendBotMessage(msg.key.remoteJid, {
                    audio: { url: music.url },
                    mimetype: 'audio/mpeg', // Asumsi MP3
                    ptt: false, // Set to true untuk mengirim sebagai voice note
                    fileName: `${music.title || 'tiktok_music'}.mp3`, // Nama file saat diunduh
                    caption: `*\ud83c\udfb5 Musik TikTok Berhasil Diunduh!*\n\n*Judul Musik:* ${music.title || 'Tidak Diketahui'}\n*Artis Musik:* ${music.author || 'Tidak Diketahui'}\n*Dari Video:* ${postTitle}`
                }, { quoted: msg });
                return;
            }

            // Jika tidak ada jenis media yang dikenali ditemukan
            await sendBotMessage(msg.key.remoteJid, { text: `\u274c Tidak dapat menemukan video, gambar, atau musik yang dapat diunduh dari URL TikTok yang diberikan.` }, { quoted: msg });

        } catch (error) {
            console.error("Error in !tiktok command:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan: ${error.message}. Pastikan URL TikTok valid dan publik.` }, { quoted: msg });
        }
    },
};