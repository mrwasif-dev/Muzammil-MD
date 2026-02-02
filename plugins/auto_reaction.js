const config = require('../configManager.js').getConfig();

module.exports = {
    name: "autoreact",
    category: "auto",
    desc: "Auto reaction settings",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (args[0] === 'on') {
            config.autoSettings.autoReaction = true;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "✅ Auto reaction enabled", quoted: message });
        } else if (args[0] === 'off') {
            config.autoSettings.autoReaction = false;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "❌ Auto reaction disabled", quoted: message });
        } else {
            await sock.sendMessage(jid, { 
                text: `Auto Reaction: ${config.autoSettings.autoReaction ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.bot.prefix}autoreact on/off`, 
                quoted: message 
            });
        }
    }
};
