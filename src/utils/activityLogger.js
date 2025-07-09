const fs = require('fs-extra');
const path = require('path');

const logFilePath = path.join(process.cwd(), 'data', 'activity_log.json');
ensureLogFile();

async function ensureLogFile() {
    if (!await fs.pathExists(logFilePath)) {
        await fs.writeJson(logFilePath, []);
    }
}

const logActivity = async (type, userJid, groupName) => {
    try {
        const logData = await fs.readJson(logFilePath);
        
        // Format waktu yang lebih mudah dibaca
        const now = new Date();
        const formattedTimestamp = now.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta' // WIB
        });

        logData.push({
            timestamp: formattedTimestamp,
            type: type,
            userJid: userJid,
            groupName: groupName
        });
        await fs.writeJson(logFilePath, logData, { spaces: 2 });
    } catch (error) {
        console.error('Gagal mencatat aktivitas:', error);
    }
};

const getAndClearLog = async () => {
    try {
        if (!await fs.pathExists(logFilePath)) return [];
        const logData = await fs.readJson(logFilePath);
        await fs.writeJson(logFilePath, []); // Reset log
        return logData;
    } catch (error) {
        console.error('Gagal mengambil dan membersihkan log:', error);
        return [];
    }
};

module.exports = {
    logActivity,
    getAndClearLog
};