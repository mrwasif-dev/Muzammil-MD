const ytdl = require('ytdl-core');
const yts = require('yt-search');

module.exports = {
    name: "yt",
    category: "downloader",
    desc: "Download YouTube video/audio",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(jid, { 
                text: `Usage: ${require('../configManager.js').getConfig().bot.prefix}yt <url/search>`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "🔍 Searching...", quoted: message });
            
            let videoId;
            if (args[0].includes('youtube.com') || args[0].includes('youtu.be')) {
                videoId = ytdl.getURLVideoID(args[0]);
            } else {
                const search = await yts(args.join(' '));
                if (!search.videos.length) {
                    return sock.sendMessage(jid, { text: "❌ No results found", quoted: message });
                }
                videoId = search.videos[0].videoId;
            }
            
            const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
            
            await sock.sendMessage(jid, {
                text: `🎬 *${info.videoDetails.title}*\n\n👁️ Views: ${info.videoDetails.viewCount}\n⏱️ Duration: ${info.videoDetails.lengthSeconds}s\n\n⬇️ Downloading...`,
                quoted: message
            });
            
            const videoStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, { 
                quality: 'highest',
                filter: 'audioandvideo' 
            });
            
            const buffers = [];
            videoStream.on('data', chunk => buffers.push(chunk));
            videoStream.on('end', async () => {
                const videoBuffer = Buffer.concat(buffers);
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: `✅ Downloaded: ${info.videoDetails.title}`,
                    quoted: message
                });
            });
            
        } catch (error) {
            await sock.sendMessage(jid, { 
                text: `❌ Error: ${error.message}`, 
                quoted: message 
            });
        }
    }
};
