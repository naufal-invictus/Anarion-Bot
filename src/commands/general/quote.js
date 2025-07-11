// src/commands/general/quote.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { askLunos } = require('../../utils/lunosApi');
const { askQwenTurbo } = require('../../utils/aiAlibaba'); // Fallback API

module.exports = {
    name: 'quote',
    category: 'general',
    description: 'Memberikan kutipan inspiratif atau filosofis acak.',
    async execute(sock, msg, args) {
        const systemPrompt = "You are a bot that provides inspiring, philosophical, or thought-provoking quotes. The quotes should be concise and impactful. Use Indonesian language.";
        const userPrompt = "Berikan satu kutipan inspiratif atau filosofis.";

        let quoteResponse;
        try {
            // Coba Lunos API (Gemini Pro)
            quoteResponse = await askLunos("google/gemini-pro", userPrompt, systemPrompt);
        } catch (lunosError) {
            console.error("Error memanggil Lunos API untuk kutipan, fallback ke Alibaba:", lunusError);
            try {
                // Fallback ke Alibaba Qwen Turbo API
                quoteResponse = await askQwenTurbo(userPrompt, systemPrompt);
            } catch (alibabaError) {
                console.error("Error memanggil Alibaba API untuk kutipan:", alibabaError);
                return sendBotMessage(msg.key.remoteJid, { text: 'Maaf, saya tidak bisa merespons saat ini. Coba lagi nanti.' }, { quoted: msg });
            }
        }

        await sendBotMessage(msg.key.remoteJid, { text: quoteResponse }, { quoted: msg });
    },
};