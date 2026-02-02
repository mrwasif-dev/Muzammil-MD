module.exports = {
    name: "tools",
    category: "tools",
    desc: "Utility tools",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        const config = require('../configManager.js').getConfig();
        
        const toolsMenu = `🛠️ *TOOLS MENU*\n\n` +
                         `${config.bot.prefix}calc <expression> - Calculator\n` +
                         `${config.bot.prefix}weather <city> - Weather info\n` +
                         `${config.bot.prefix}time - Current time\n` +
                         `${config.bot.prefix}quote - Random quote\n` +
                         `${config.bot.prefix}joke - Random joke\n` +
                         `${config.bot.prefix}shorturl <url> - Shorten URL\n` +
                         `${config.bot.prefix}qr <text> - Generate QR\n` +
                         `${config.bot.prefix}translate <text> - Translate\n`;
        
        await sock.sendMessage(jid, { text: toolsMenu, quoted: message });
    }
};
