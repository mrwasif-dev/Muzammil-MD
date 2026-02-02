const axios = require('axios');

module.exports = {
    name: "tiktok",
    category: "downloader",
    desc: "Download TikTok video",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(jid, { 
                text: `Usage: ${require('../configManager.js').getConfig().bot.prefix}tiktok <url>`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "⬇️ Downloading TikTok...", quoted: message });
            
            const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(args[0])}`;
            const response = await axios.get(apiUrl);
            
            if (response.data.video) {
                const videoRes = await axios.get(response.data.video, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoRes.data);
                
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: `✅ TikTok Video\n\n🎵 ${response.data.music || 'No music info'}\n👤 ${response.data.author || 'Unknown'}`,
                    quoted: message
                });
            } else {
                await sock.sendMessage(jid, { 
                    text: "❌ Could not download video", 
                    quoted: message 
                });
            }
            
        } catch (error) {
            await sock.sendMessage(jid, { 
                text: `❌ Error: ${error.message}`, 
                quoted: message 
            });
        }
    }
};
