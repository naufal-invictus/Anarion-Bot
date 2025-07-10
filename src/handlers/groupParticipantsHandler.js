// src/handlers/groupParticipantsHandler.js (Diperbarui untuk meneruskan logger ke getJidUser)
const db = require('../utils/db');
const botMessenger = require('../utils/botMessenger');

module.exports = async (sock, anu, logger) => { // 'logger' sudah tersedia di sini
    logger.info(`[GROUP_PARTICIPANTS] Menerima update untuk grup: ${anu.id}, aksi: ${anu.action}`);

    const groupJid = anu.id;
    const participants = anu.participants; // Array of JIDs
    const action = anu.action; // 'add' or 'remove'

    const groupsData = await db.readData('groups'); // Data dari groups.json
    const config = await db.readData('config');     // Baca config.json
    const messagesData = await db.readData('messages');

    // Logging diagnostik config (tetap dipertahankan)
    logger.info(`[GROUP_PARTICIPANTS_DEBUG] Isi config.groups: ${JSON.stringify(config.groups)}`);
    logger.info(`[GROUP_PARTICIPANTS_DEBUG] Kategori untuk ${groupJid}: ${config.groups[groupJid]}`);

    // Dapatkan kategori grup dari config.json
    const groupCategory = config.groups[groupJid];

    // Filter Grup: Hanya merespons di grup yang diizinkan (ada di config.json dan tidak diblokir)
    if (!groupCategory || groupCategory === 'blocked') {
        logger.info(`[GROUP_PARTICIPANTS] Grup ${groupJid} tidak ditemukan di config.groups atau diblokir. Mengabaikan update.`);
        return;
    }
    logger.info(`[GROUP_PARTICIPANTS] Grup ${groupJid} diizinkan dan tidak diblokir.`);

    let groupConfig = groupsData[groupJid]; // Data dari groups.json

    // Inisialisasi groupConfig jika belum ada (hanya jika grup diizinkan)
    if (!groupConfig) {
        groupConfig = { 
            groupChatHistory: [], 
            rpModeEnabled: false, 
            welcomeMessage: "", 
            goodbyeMessage: "", 
            goodbyePrivateMessage: "", 
            groupInviteLink: "" 
        }; 
        groupsData[groupJid] = groupConfig;
        await db.writeData('groups', groupsData);
        logger.info(`[GROUP_PARTICIPANTS] Konfigurasi baru untuk grup ${groupJid} diinisialisasi.`);
    }

    // Inisialisasi properti pesan sambutan/perpisahan jika undefined, null, atau string kosong
    let configUpdated = false;
    if (groupConfig.welcomeMessage === undefined || groupConfig.welcomeMessage === null || groupConfig.welcomeMessage === "") {
        groupConfig.welcomeMessage = messagesData.defaultWelcomeMessage || "Selamat datang, @{tag} di grup kami! Senang Anda bergabung.";
        configUpdated = true;
    }
    if (groupConfig.goodbyeMessage === undefined || groupConfig.goodbyeMessage === null || groupConfig.goodbyeMessage === "") {
        groupConfig.goodbyeMessage = messagesData.defaultGoodbyeMessage || "Sampai jumpa, @{tag}! Kami akan merindukanmu. Jika ingin bergabung kembali, silakan klik link grup ini: [LINK_GRUP_ANDA]";
        configUpdated = true;
    }
    if (groupConfig.goodbyePrivateMessage === undefined || groupConfig.goodbyePrivateMessage === null || groupConfig.goodbyePrivateMessage === "") {
        groupConfig.goodbyePrivateMessage = messagesData.defaultGoodbyePrivateMessage || "Halo @{tag}, Anda telah keluar dari grup. Jika ingin bergabung kembali, silakan klik link grup ini: [LINK_GRUP_ANDA].";
        configUpdated = true;
    }
    if (groupConfig.groupInviteLink === undefined || groupConfig.groupInviteLink === null) {
        groupConfig.groupInviteLink = ""; 
        configUpdated = true;
    }
    if (configUpdated) {
        await db.writeData('groups', groupsData); 
        logger.info(`[GROUP_PARTICIPANTS] Default messages for ${groupJid} initialized/updated.`);
    }

    const currentSock = botMessenger.getClientSock();
    if (!currentSock) {
        logger.error(`[GROUP_PARTICIPANTS] botMessenger belum sepenuhnya siap (sock tidak tersedia). Gagal menangani update partisipan grup.`);
        return; 
    }
    logger.info(`[GROUP_PARTICIPANTS] botMessenger siap. Memproses ${participants.length} partisipan.`);


    for (const participantJid of participants) {
        // <<< TERUSKAN 'logger' KE getJidUser >>>
        const participantName = await getJidUser(currentSock, participantJid, groupJid, logger); 
        // <<< AKHIR PERUBAHAN >>>
        const participantTag = `@${participantJid.split('@')[0]}`; 

        let messageText = '';
        let mentions = [participantJid]; 

        if (action === 'add') {
            logger.info(`[GROUP_PARTICIPANTS] Aksi: 'add' untuk ${participantName} (${participantJid})`);
            const finalWelcomeMessage = groupConfig.welcomeMessage || messagesData.defaultWelcomeMessage;

            if (finalWelcomeMessage) {
                messageText = finalWelcomeMessage.replace(/@{tag}/g, participantTag);
                logger.info(`[GROUP_PARTICIPANTS] Mengirim pesan sambutan ke grup ${groupJid}. Pesan: "${messageText}"`);
                await botMessenger.sendBotMessage(groupJid, { text: messageText, mentions: mentions });
            } else {
                logger.warn(`[GROUP_PARTICIPANTS] welcomeMessage (final) kosong untuk grup ${groupJid}. Tidak mengirim pesan sambutan.`);
            }
        } else if (action === 'remove') {
            logger.info(`[GROUP_PARTICIPANTS] Aksi: 'remove' untuk ${participantName} (${participantJid})`);
            const finalGoodbyeMessage = groupConfig.goodbyeMessage || messagesData.defaultGoodbyeMessage;
            const finalGoodbyePrivateMessage = groupConfig.goodbyePrivateMessage || messagesData.defaultGoodbyePrivateMessage;

            if (finalGoodbyeMessage) {
                messageText = finalGoodbyeMessage.replace(/@{tag}/g, participantTag);
                if (groupConfig.groupInviteLink) {
                    messageText = messageText.replace(/\[LINK_GRUP_ANDA\]/g, groupConfig.groupInviteLink);
                } else {
                    messageText = messageText.replace(/\[LINK_GRUP_ANDA\]/g, "Hubungi admin grup untuk link.");
                }
                logger.info(`[GROUP_PARTICIPANTS] Mengirim pesan perpisahan ke grup ${groupJid}. Pesan: "${messageText}"`);
                await botMessenger.sendBotMessage(groupJid, { text: messageText, mentions: mentions });

                if (finalGoodbyePrivateMessage) {
                    let privateMessageText = finalGoodbyePrivateMessage.replace(/@{tag}/g, participantTag);
                    if (groupConfig.groupInviteLink) {
                        privateMessageText = privateMessageText.replace(/\[LINK_GRUP_ANDA\]/g, groupConfig.groupInviteLink);
                    } else {
                        privateMessageText = privateMessageText.replace(/\[LINK_GRUP_ANDA\]/g, "Hubungi admin grup untuk link.");
                    }

                    try {
                        logger.info(`[GROUP_PARTICIPANTS] Mengirim pesan pribadi perpisahan ke ${participantJid}. Pesan: "${privateMessageText}"`);
                        await botMessenger.sendBotMessage(participantJid, { text: privateMessageText });
                    } catch (dmError) {
                        logger.warn(`[GROUP_PARTICIPANTS] Gagal mengirim pesan pribadi ke ${participantJid}:`, dmError);
                    }
                } else {
                    logger.warn(`[GROUP_PARTICIPANTS] goodbyePrivateMessage (final) kosong untuk grup ${groupJid}. Tidak mengirim pesan pribadi perpisahan.`);
                }
            } else {
                logger.warn(`[GROUP_PARTICIPANTS] goodbyeMessage (final) kosong untuk grup ${groupJid}. Tidak mengirim pesan perpisahan ke grup.`);
            }
        }
    }
};

// <<< TERIMA 'logger' SEBAGAI PARAMETER >>>
async function getJidUser(sockInstance, jid, groupJid, logger) { 
    try {
        const groupMetadata = await sockInstance.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === jid);
        if (participant && participant.pushName) {
            return participant.pushName;
        }
        const contact = await sockInstance.getContact(jid);
        if (contact && contact.verifiedName) {
            return contact.verifiedName;
        } else if (contact && contact.notify) {
            return contact.notify;
        }
    } catch (error) {
        logger.warn(`[GET_JID_USER] Gagal mendapatkan metadata/nama untuk ${jid} di grup ${groupJid}:`, error);
    }
    return jid.split('@')[0];
}