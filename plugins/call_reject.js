const config = require('../configManager.js').getConfig();

module.exports = {
    name: "callreject",
    category: "auto",
    desc: "Auto reject calls",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (args[0] === 'on') {
            config.autoSettings.callRejection = true;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "✅ Call rejection enabled", quoted: message });
        } else if (args[0] === 'off') {
            config.autoSettings.callRejection = false;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "❌ Call rejection disabled", quoted: message });
        } else {
            await sock.sendMessage(jid, { 
                text: `Call Rejection: ${config.autoSettings.callRejection ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.bot.prefix}callreject on/off`, 
                quoted: message 
            });
        }
    }
};
