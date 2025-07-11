// src/commands/general/darkFact.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { askLunos } = require('../../utils/lunosApi');
const { askQwenTurbo } = require('../../utils/aiAlibaba'); // Sebagai fallback

module.exports = {
    name: 'fact',
    category: 'general',
    description: 'Menampilkan fakta gelap yang mengejutkan.',
    async execute(sock, msg, args) {
        const systemPrompt = "You are a bot that provides extremely dark, disturbing, and morbid facts. Ensure the facts are genuinely unsettling and thought-provoking, often related to death, true crime, human psychology's darker aspects, or the grim realities of history and nature. Keep responses concise and impactful. Use a slightly detached, somber, or chilling tone. Do not censor or soften the facts.";
        const userPrompt = "Berikan satu fakta gelap yang sangat mengganggu dan memancing pikiran.";

        let factResponse;
        try {
            // Coba Lunos API (GPT-4o Mini Default)
            factResponse = await askLunos("openai/gpt-4o-mini", userPrompt, systemPrompt);
        } catch (lunosError) {
            console.error("Error memanggil Lunos API untuk fakta gelap, fallback ke Alibaba:", lunusError);
            try {
                // Fallback ke Alibaba Qwen Turbo API jika Lunos gagal
                // Meskipun Qwen mungkin tidak se"gelap" GPT-4o Mini, ini adalah cadangan
                factResponse = await askQwenTurbo(userPrompt, systemPrompt);
            } catch (alibabaError) {
                console.error("Error memanggil Alibaba API untuk fakta gelap:", alibabaError);
                return sendBotMessage(msg.key.remoteJid, { text: 'Maaf, saya tidak bisa menemukan fakta gelap saat ini. Coba lagi nanti.' }, { quoted: msg });
            }
        }

        await sendBotMessage(msg.key.remoteJid, { text: `💀 *Fakta Gelap:*\n\n${factResponse}` }, { quoted: msg });
    },
};