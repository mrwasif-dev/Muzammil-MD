const fs = require('fs');
const plugins = {};

if (fs.existsSync('./plugins')) {
    const files = fs.readdirSync('./plugins').filter(f => f.endsWith('.js'));
    
    files.forEach(file => {
        const name = file.replace('.js', '');
        try {
            plugins[name] = require(`./plugins/${file}`);
            console.log(`✅ Plugin loaded: ${name}`);
        } catch (e) {
            console.log(`❌ Failed to load ${file}:`, e.message);
        }
    });
}

module.exports = plugins;
