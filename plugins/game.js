module.exports = {
    name: "game",
    category: "games",
    desc: "Play games",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        const config = require('../configManager.js').getConfig();
        
        const gamesMenu = `🎮 *GAMES MENU*\n\n` +
                         `${config.bot.prefix}guess - Guess number\n` +
                         `${config.bot.prefix}trivia - Trivia quiz\n` +
                         `${config.bot.prefix}hangman - Hangman game\n` +
                         `${config.bot.prefix}tictactoe - Tic Tac Toe\n` +
                         `${config.bot.prefix}slot - Slot machine\n` +
                         `${config.bot.prefix}8ball <question> - Magic 8 ball\n`;
        
        await sock.sendMessage(jid, { text: gamesMenu, quoted: message });
    }
};
