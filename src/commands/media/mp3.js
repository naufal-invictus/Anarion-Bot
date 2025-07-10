// src/commands/media/mp3.js
const { fetchMediaFromMaelyn } = require('../../utils/aiMaelyn.js');
const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'mp3',
    category: 'media',
    description: 'Mengunduh audio MP3 dari URL media sosial.',
    execute: async (sock, msg, args) => {
        const urlSosmed = args[0];
        if (!urlSosmed) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Mohon sertakan URL media sosial untuk mengunduh MP3.\nContoh: `!mp3 <link_video_sosmed>`' }, { quoted: msg });
        }

        try {

            const result = await fetchMediaFromMaelyn(urlSosmed);

            if (result?.mp3_download_url) {
                const { title, description, thumbnail, mp3_download_url, mp3_file_size, platform } = result;

                // Siapkan caption untuk pesan awal (bisa berisi info teks)
                let caption = `*🎵 Informasi MP3 Berhasil Diperoleh*\n\n`;
                caption += `*Judul:* ${title || 'Tidak Diketahui'}\n`;
                caption += `*Deskripsi:* ${description || 'Tidak Ada'}\n`;
                caption += `*Platform:* ${platform || 'Tidak Diketahui'}\n`;
                caption += `*Ukuran File:* ${(mp3_file_size / (1024 * 1024)).toFixed(2)} MB\n\n`;
                caption += `_Mengirimkan Audio..._`; // Beri tahu pengguna bahwa audio akan dikirim

                // Kirim thumbnail terlebih dahulu (jika tersedia) dengan caption
                if (thumbnail) {
                    await sendBotMessage(msg.key.remoteJid, {
                        image: { url: thumbnail },
                        caption: caption,
                    }, { quoted: msg });
                } else {
                    // Jika tidak ada thumbnail, kirim pesan teks saja
                    await sendBotMessage(msg.key.remoteJid, {
                        text: caption,
                    }, { quoted: msg });
                }

                // Kirim file audio
                await sendBotMessage(msg.key.remoteJid, {
                    audio: { url: mp3_download_url },
                    mimetype: 'audio/mpeg', // Asumsi format MP3
                    ptt: false, // False untuk mengirim sebagai file audio, true untuk voice note
                    fileName: `${title || 'audio'}.mp3` // Menyertakan nama file
                }, { quoted: msg });

            } else {
                await sendBotMessage(msg.key.remoteJid, { text: `❌ Gagal mengunduh MP3. Audio tidak ditemukan atau URL tidak didukung.` }, { quoted: msg });
            }

        } catch (error) {
            console.error("Error pada perintah !mp3:", error.message);
            await sendBotMessage(msg.key.remoteJid, { text: `Terjadi kesalahan: ${error.message}` }, { quoted: msg });
        }
    },
};