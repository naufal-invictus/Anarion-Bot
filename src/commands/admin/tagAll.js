const { sendBotMessage } = require('../../utils/botMessenger'); // Tambahkan ini

module.exports = {
    name: 'tagall',
    category: 'admin',
    description: 'Menyebut (tag) semua anggota grup.',
    execute: async (sock, msg, args) => {
        try {
            const jid = msg.key.remoteJid;
            if (!jid.endsWith('@g.us')) {
                return sendBotMessage(jid, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
            }

            // 1. Ambil metadata grup untuk mendapatkan daftar anggota
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;

            // 2. Siapkan teks awal dan array untuk JID yang akan di-mention
            let text = '';
            if (args.length > 0) {
                text += `${args.join(' ')}\n\n`;
            } else {
                text += 'Panggilan untuk seluruh warga grup!\n\n';
            }
            
            const mentions = [];

            // 3. Loop melalui semua anggota untuk membuat teks mention
            // Ini adalah bagian kunci dari template sayf-bot
            for (let mem of participants) {
                // Tambahkan @username ke dalam teks yang akan ditampilkan
                text += `➲ @${mem.id.split('@')[0]}\n`;
                // Kumpulkan JID lengkap untuk properti 'mentions'
                mentions.push(mem.id);
            }
            
            // 4. Kirim pesan dengan teks yang sudah dibuat dan JID yang akan di-mention
            await sendBotMessage(jid, {
                text: text.trim(),
                mentions: mentions
            }, { quoted: msg });

        } catch (error) {
            console.error("Error di perintah !tagall:", error);
            // Pesan error ini lebih akurat. Bot hanya perlu menjadi anggota, bukan admin.
            await sendBotMessage(msg.key.remoteJid, { text: `Gagal melakukan tagall. Pastikan bot adalah anggota dari grup ini.` }, { quoted: msg });
        }
    },
};