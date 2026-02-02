const fs = require('fs');
const path = require('path');

const plugins = {};
const pluginDir = './plugins';

if (fs.existsSync(pluginDir)) {
    const files = fs.readdirSync(pluginDir)
        .filter(file => file.endsWith('.js'));
    
    files.forEach(file => {
        try {
            const pluginName = path.basename(file, '.js');
            plugins[pluginName] = require(`./plugins/${file}`);
            console.log(`✅ Plugin: ${pluginName}`);
        } catch (err) {
            console.log(`❌ ${file}: ${err.message}`);
        }
    });
}

console.log(`📦 Total: ${Object.keys(plugins).length} plugins`);
module.exports = plugins;
