const config = require('../configManager.js').getConfig();

module.exports = {
    name: "menu",
    category: "general",
    desc: "Show all commands",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        const fs = require('fs');
        const plugins = {};
        
        if (fs.existsSync('./plugins')) {
            fs.readdirSync('./plugins')
                .filter(f => f.endsWith('.js'))
                .forEach(file => {
                    const name = file.replace('.js', '');
                    try {
                        plugins[name] = require(`./${file}`);
                    } catch (e) {}
                });
        }
        
        let menu = `🤖 *${config.bot.name} BOT MENU*\n`;
        menu += `Prefix: *${config.bot.prefix}*\n\n`;
        
        const categories = {};
        Object.values(plugins).forEach(plugin => {
            if (plugin.category) {
                if (!categories[plugin.category]) categories[plugin.category] = [];
                categories[plugin.category].push(plugin);
            }
        });
        
        for (const [category, plgs] of Object.entries(categories)) {
            menu += `*${category.toUpperCase()}*\n`;
            plgs.forEach(p => {
                menu += `• ${config.bot.prefix}${p.name} - ${p.desc || 'No description'}\n`;
            });
            menu += '\n';
        }
        
        menu += `📌 *Total Commands:* ${Object.keys(plugins).length}\n`;
        menu += `🔧 *Use:* ${config.bot.prefix}cmd <args>\n`;
        menu += `ℹ️ *Example:* ${config.bot.prefix}ping`;
        
        await sock.sendMessage(jid, { text: menu, quoted: message });
    }
};
