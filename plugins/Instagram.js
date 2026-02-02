const axios = require('axios');

module.exports = {
    name: "ig",
    category: "downloader",
    desc: "Download Instagram post/reel",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(jid, { 
                text: `Usage: ${require('../configManager.js').getConfig().bot.prefix}ig <url>`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "⬇️ Downloading Instagram...", quoted: message });
            
            const apiUrl = `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(args[0])}`;
            const response = await axios.get(apiUrl, {
                headers: {
                    'x-rapidapi-key': 'your-api-key', // Add your API key
                    'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com'
                }
            });
            
            if (response.data && response.data.video_url) {
                const videoRes = await axios.get(response.data.video_url, { responseType: 'arraybuffer' });
                const videoBuffer = Buffer.from(videoRes.data);
                
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: `✅ Instagram ${response.data.is_video ? 'Video' : 'Post'}\n\n${response.data.caption || ''}`,
                    quoted: message
                });
            } else if (response.data && response.data.image_url) {
                const imageRes = await axios.get(response.data.image_url, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageRes.data);
                
                await sock.sendMessage(jid, {
                    image: imageBuffer,
                    caption: `✅ Instagram Photo\n\n${response.data.caption || ''}`,
                    quoted: message
                });
            } else {
                await sock.sendMessage(jid, { 
                    text: "❌ Could not download", 
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
