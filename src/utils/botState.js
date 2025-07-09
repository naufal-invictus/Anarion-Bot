// src/utils/botState.js
let isActive = true;

module.exports = {
    isActive: () => isActive,
    setActive: (state) => {
        isActive = state;
        console.log(`Bot state changed to: ${isActive ? 'ON' : 'OFF'}`);
    },
};