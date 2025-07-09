const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./src/handlers/messageHandler');
const groupUpdateHandler = require('./src/handlers/groupUpdateHandler');

require('dotenv').config();

const logger = pino({ level: 'info' });

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state, logger });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Pindai QR code ini dengan ponsel Anda:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus: ', lastDisconnect.error, ', menyambungkan kembali: ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Koneksi berhasil!');
            // --- Mulai penjadwal setelah koneksi berhasil ---
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            await messageHandler(sock, msg, logger);
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        await groupUpdateHandler(sock, update);
    });
}

connectToWhatsApp();