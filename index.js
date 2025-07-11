// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const qrcode = require('qrcode-terminal');
const messageHandler = require('./src/handlers/messageHandler');
const groupParticipantsHandler = require('./src/handlers/groupParticipantsHandler');
const db = require('./src/utils/db');
const botState = require('./src/utils/botState');
const botMessenger = require('./src/utils/botMessenger'); 
const gameManager = require('./src/utils/gameManager'); // Import gameManager
require('dotenv').config();

const logger = P({ level: 'info' });

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    const sock = makeWASocket({
        auth: state,
        logger,
        browser: ['Anarion-Bot', 'Chrome', '1.0.0'],
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update; 

        if (qr) {
            console.log(chalk.yellow('Pindai QR code ini dengan ponsel Anda:'));
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.badAuth) {
                console.log(chalk.red('❌ Bad Auth Token, Please Delete baileys_auth_info and Scan Again'));
                process.exit();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(chalk.yellow('Connection closed, reconnecting...'));
                connectToWhatsApp();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(chalk.yellow('Connection Lost from Server, reconnecting...'));
                connectToWhatsApp();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(chalk.yellow('Connection Replaced, Another new session opened, Please Close Current Session First'));
                process.exit();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('Device Logged Out, Please Delete baileys_auth_info and Scan Again.'));
                process.exit();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(chalk.yellow('Restart Required, Restarting...'));
                connectToWhatsApp();
            } else if (reason === DisconnectReason.timedOut) {
                console.log(chalk.yellow('Connection TimedOut, Reconnecting...'));
                connectToWhatsApp();
            } else {
                console.log(chalk.red(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`));
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log(chalk.green('✅ Connected to WhatsApp!'));
            botState.setActive(true);
            console.log(chalk.blue('Bot is now active.'));
            
            botMessenger.init(logger, sock); 
            await gameManager.loadGameData(); // Panggil loadGameData setelah botMessenger diinisialisasi
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate.messages) return;
        const msg = chatUpdate.messages[0];
        if (!msg.message) return;

        await messageHandler(sock, msg, logger); 
    });

    sock.ev.on('group-participants.update', async (anu) => {
        await groupParticipantsHandler(sock, anu, logger); 
    });
}

connectToWhatsApp();