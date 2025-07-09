const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

// Ensure data directory and files exist
async function initializeDB() {
    await fs.ensureDir(dataDir);
    const files = ['config.json', 'users.json', 'groups.json'];
    for (const file of files) {
        const filePath = path.join(dataDir, file);
        if (!(await fs.pathExists(filePath))) {
            await fs.writeJson(filePath, {});
            console.log(`Created empty database file: ${file}`);
        }
    }
}

initializeDB();

async function readData(fileName) {
    const filePath = path.join(dataDir, `${fileName}.json`);
    try {
        return await fs.readJson(filePath);
    } catch (error) {
        console.error(`❌ Error reading from ${filePath}:`, error);
        return null; // Return null to handle errors gracefully
    }
}

async function writeData(fileName, data) {
    const filePath = path.join(dataDir, `${fileName}.json`);
    try {
        await fs.writeJson(filePath, data, { spaces: 2 });
    } catch (error) {
        console.error(`❌ Error writing to ${filePath}:`, error);
    }
}

module.exports = {
    readData,
    writeData,
};