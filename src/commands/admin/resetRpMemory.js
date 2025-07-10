// src/commands/admin/resetRpMemory.js (Diperbarui)
const db = require('../../utils/db');

module.exports = {
    name: 'resetrp', // Nama perintah
    category: 'admin',
    description: 'Menghapus semua memori roleplay (riwayat chat) untuk grup ini dan me-restart bot.',
    execute: async (sock, msg, args, userRole) => {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: 'Perintah ini hanya bisa digunakan di dalam grup.' }, { quoted: msg });
        }

        // Hanya owner, developer, atau admin yang bisa menggunakan perintah ini
        if (userRole !== 'owner' && userRole !== 'developer' && userRole !== 'admin') {
            return sock.sendMessage(jid, { text: '⛔ Perintah ini hanya untuk Admin grup atau lebih tinggi.' }, { quoted: msg });
        }

        try {
            const groupsData = await db.readData('groups');
            // Pastikan data grup ada sebelum mencoba mereset
            if (groupsData[jid]) {
                // Perbaiki: Reset groupChatHistory, bukan userConversations
                groupsData[jid].groupChatHistory = []; // Reset memori roleplay menjadi array kosong
                await db.writeData('groups', groupsData);
                
                await sock.sendMessage(jid, { text: '✅ Memori roleplay untuk grup ini telah direset. Bot akan me-restart untuk menerapkan perubahan.' }, { quoted: msg });

                // Tambahkan delay singkat sebelum restart untuk memastikan pesan terkirim
                await new Promise(resolve => setTimeout(resolve, 3000)); 
                
                // Restart bot
                // Ini mengasumsikan Anda menggunakan PM2 atau sistem lain yang otomatis me-restart proses Node.js
                process.exit(0); 
            } else {
                await sock.sendMessage(jid, { text: 'Tidak ada konfigurasi grup ditemukan untuk grup ini.' }, { quoted: msg });
            }
        } catch (error) {
            console.error(`❌ Error pada perintah !${this.name}:`, error);
            await sock.sendMessage(jid, { text: `Terjadi kesalahan internal pada perintah !${this.name}.` }, { quoted: msg });
        }
    },
};