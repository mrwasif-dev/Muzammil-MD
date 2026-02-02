const config = require('../configManager.js').getConfig();

module.exports = {
    name: "autoforward",
    category: "auto",
    desc: "Auto forward messages",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (args[0] === 'on') {
            config.autoSettings.autoForward = true;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "✅ Auto forward enabled", quoted: message });
        } else if (args[0] === 'off') {
            config.autoSettings.autoForward = false;
            require('../configManager.js').saveConfig(config);
            await sock.sendMessage(jid, { text: "❌ Auto forward disabled", quoted: message });
        } else {
            await sock.sendMessage(jid, { 
                text: `Auto Forward: ${config.autoSettings.autoForward ? '✅ ON' : '❌ OFF'}\n\nUsage: ${config.bot.prefix}autoforward on/off`, 
                quoted: message 
            });
        }
    }
};
