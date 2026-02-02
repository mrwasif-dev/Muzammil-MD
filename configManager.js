const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const DEFAULT_CONFIG = {
    bot: {
        name: "Muzammil MD",
        prefix: ".",
        mode: "public",
        welcomeMessage: "Welcome to the group!",
        autoReply: true,
        autoDownload: true
    },
    features: {
        youtube: true,
        facebook: true,
        tiktok: true,
        instagram: true,
        sticker: true,
        ai: true,
        downloader: true,
        tools: true,
        games: true,
        nsfw: false
    },
    autoSettings: {
        readReceipts: true,
        onlinePresence: true,
        callRejection: true,
        autoReaction: true,
        autoReplyStatus: true,
        autoForward: false,
        autoJoin: false,
        antiDelete: false,
        antiSpam: true
    },
    sudo: ["923053956147"],
    session: {
        savePath: "./auth_info"
    }
};

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }
    
    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            }
        } catch (err) {
            console.log('❌ Config error:', err.message);
        }
        this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
    
    saveConfig(newConfig) {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
            this.config = newConfig;
            return true;
        } catch (err) {
            console.log('❌ Config save error:', err.message);
            return false;
        }
    }
    
    updateFromWeb(data) {
        const updated = {
            ...this.config,
            bot: {
                ...this.config.bot,
                prefix: data.prefix || this.config.bot.prefix,
                mode: data.mode || this.config.bot.mode
            },
            features: data.features ? JSON.parse(data.features) : this.config.features,
            autoSettings: data.autoSettings ? JSON.parse(data.autoSettings) : this.config.autoSettings
        };
        return this.saveConfig(updated);
    }
    
    getConfig() { return this.config; }
}

module.exports = new ConfigManager();
