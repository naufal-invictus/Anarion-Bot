// src/utils/botMessenger.js
let loggerInstance = null; // Untuk menyimpan instance logger pino
let clientSock = null; // Untuk menyimpan instance sock Baileys

/**
 * Menginisialisasi modul botMessenger dengan instance logger pino dan objek sock Baileys.
 * Fungsi ini harus dipanggil sekali saat startup bot di index.js.
 * @param {object} pinoLogger Instance logger pino.
 * @param {object} sockInstance Objek sock Baileys.
 */
function init(pinoLogger, sockInstance) {
    loggerInstance = pinoLogger;
    clientSock = sockInstance; // Simpan instance sock
    if (loggerInstance) {
        loggerInstance.info('botMessenger berhasil diinisialisasi.');
    }
}

/**
 * Mengirim pesan menggunakan objek sock Baileys yang disimpan dan mencatat pesan keluar.
 * @param {string} jid JID (ID chat) tujuan pengiriman pesan.
 * @param {object|string} content Konten pesan (teks, gambar, video, audio, dll.).
 * @param {object} options Opsi tambahan untuk pengiriman pesan.
 */
async function sendBotMessage(jid, content, options = {}) { // Perhatikan: tidak ada argumen 'sock' di sini
    if (!clientSock) {
        // Log error jika clientSock belum diinisialisasi
        if (loggerInstance) {
            loggerInstance.error('botMessenger belum diinisialisasi dengan objek sock. Tidak dapat mengirim pesan.');
        } else {
            console.error('botMessenger belum diinisialisasi dengan objek sock. Tidak dapat mengirim pesan.');
        }
        throw new Error('Bot belum siap mengirim pesan. Objek sock tidak tersedia.');
    }

    if (loggerInstance) {
        // Log konten pesan keluar
        let logContent = content;
        if (typeof content === 'object') {
            if (content.text) logContent = content.text;
            else if (content.caption) logContent = `[Caption] ${content.caption}`;
            else if (content.image) logContent = `[Image] ${content.caption || 'No caption'}`;
            else if (content.video) logContent = `[Video] ${content.caption || 'No caption'}`;
            else if (content.audio) logContent = `[Audio] ${content.fileName || 'No filename'}`;
            logContent = JSON.stringify(logContent); // Stringify object for logging
        }
        loggerInstance.info({ to: jid, type: 'outgoing', message_content: logContent }, `Bot mengirim pesan`);
    }

    try {
        await clientSock.sendMessage(jid, content, options); // Menggunakan clientSock yang disimpan
    } catch (error) {
        if (loggerInstance) {
            loggerInstance.error({ err: error, to: jid, sent_content: content }, 'Gagal mengirim pesan');
        } else {
            console.error('Failed to send message and logger not initialized:', error);
        }
        throw error;
    }
}

/**
 * Mengembalikan instance sock Baileys yang disimpan.
 * Berguna untuk modul lain yang membutuhkan akses langsung ke sock (misalnya untuk groupMetadata).
 * @returns {object|null} Instance sock Baileys atau null jika belum diinisialisasi.
 */
function getClientSock() {
    return clientSock;
}

/**
 * Mengembalikan instance logger pino yang disimpan.
 * Berguna untuk modul lain yang membutuhkan akses ke logger.
 * @returns {object|null} Instance logger pino atau null jika belum diinisialisasi.
 */
function getLoggerInstance() {
    return loggerInstance;
}


module.exports = {
    init,
    sendBotMessage,
    getClientSock, // Export the clientSock getter
    getLoggerInstance, // Export the logger getter
};