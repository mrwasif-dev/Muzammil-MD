const axios = require('axios');

module.exports = {
    name: "fb",
    category: "downloader",
    desc: "Download Facebook video",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(jid, { 
                text: `Usage: ${require('../configManager.js').getConfig().bot.prefix}fb <url>`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "⬇️ Downloading Facebook video...", quoted: message });
            
            const apiUrl = `https://api.video.facebook.com/video?url=${encodeURIComponent(args[0])}`;
            const response = await axios.get(apiUrl);
            
            if (response.data && response.data.video) {
                const videoRes = await axios.get(response.data.video, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoRes.data);
                
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: "✅ Facebook Video Downloaded",
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
