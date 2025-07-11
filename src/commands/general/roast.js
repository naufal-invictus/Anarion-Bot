// src/commands/general/roast.js
const { sendBotMessage } = require('../../utils/botMessenger');
const { askLunos } = require('../../utils/lunosApi');
const { askQwenTurbo } = require('../../utils/aiAlibaba');

module.exports = {
    name: 'roast',
    category: 'general',
    description: 'Roast kepribadian  Contoh: !roast INFJ 2W3 ILE',
    async execute(sock, msg, args) {
        const input = args.join(' ');

        if (!input) {
            return sendBotMessage(msg.key.remoteJid, { text: 'Sintaks salah. Gunakan: !roast <MBTI> <Enneagram> <Socionics>' }, { quoted: msg });
        }

        const systemPrompt = "You are a savage roasting master who delivers brutally honest, cutting Indonesian roasts that hit deep and expose people's worst traits. Your roasts are merciless, on-point, and designed to make people question their life choices. Use casual Indonesian language with emojis. Format: 1 brutal roasting paragraph + numbered list of 10 biggest sins.";
        const userPrompt = `Roast habis-habisan tipe kepribadian ${input} dengan gaya yang sakit dan menusuk banget! Mulai dengan 1 paragraf roasting yang brutal, lalu kasih 10 dosa besar mereka dalam bentuk list bernomor. Pakai bahasa Indonesia kasual dan emoji.`;

        let roastingResponse;
        try {
            // Coba Lunos API (GPT-4o Mini Default)
            roastingResponse = await askLunos("openai/gpt-4o-mini", userPrompt, systemPrompt);
        } catch (lunosError) {
            console.error("Error memanggil Lunos API, fallback ke Alibaba:", lunusError);
            try {
                // Fallback ke Alibaba Qwen Turbo API
                roastingResponse = await askQwenTurbo(userPrompt, systemPrompt);
            } catch (alibabaError) {
                console.error("Error memanggil Alibaba API:", alibabaError);
                return sendBotMessage(msg.key.remoteJid, { text: 'Maaf, saya tidak bisa merespons saat ini. Coba lagi nanti.' }, { quoted: msg });
            }
        }

        await sendBotMessage(msg.key.remoteJid, { text: roastingResponse }, { quoted: msg });
    },
};