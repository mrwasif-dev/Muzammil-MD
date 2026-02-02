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
            plugins[pluginName] = require(path.join(__dirname, 'plugins', file));
            console.log(`✅ Plugin loaded: ${pluginName}`);
        } catch (err) {
            console.log(`❌ Failed to load ${file}:`, err.message);
        }
    });
}

console.log(`📦 Total plugins: ${Object.keys(plugins).length}`);
module.exports = plugins;
