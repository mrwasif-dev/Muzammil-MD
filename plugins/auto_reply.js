const config = require('../configManager.js').getConfig();

module.exports = {
    name: "autoreply",
    category: "auto",
    desc: "Auto reply to messages",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (args[0] === 'on') {
            config.autoSettings.autoReplyStatus = true;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "✅ Auto reply enabled", quoted: message });
        } else if (args[0] === 'off') {
            config.autoSettings.autoReplyStatus = false;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "❌ Auto reply disabled", quoted: message });
        } else {
            await sock.sendMessage(jid, { 
                text: `Auto Reply: ${config.autoSettings.autoReplyStatus ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.bot.prefix}autoreply on/off`, 
                quoted: message 
            });
        }
    }
};
