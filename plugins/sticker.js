const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: "sticker",
    category: "tools",
    desc: "Convert image/video to sticker",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!message.message.imageMessage && !message.message.videoMessage) {
            return sock.sendMessage(jid, { 
                text: `Send an image/video with caption *${require('../configManager.js').getConfig().bot.prefix}sticker*`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "🔄 Creating sticker...", quoted: message });
            
            let mediaBuffer;
            if (message.message.imageMessage) {
                mediaBuffer = await sock.downloadMediaMessage(message);
            } else if (message.message.videoMessage) {
                mediaBuffer = await sock.downloadMediaMessage(message);
            }
            
            const sticker = new Sticker(mediaBuffer, {
                pack: 'Muzammil MD',
                author: 'WhatsApp Bot',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                quality: 50,
            });
            
            await sock.sendMessage(jid, await sticker.toMessage(), { quoted: message });
            
        } catch (error) {
            await sock.sendMessage(jid, { 
                text: `❌ Error: ${error.message}`, 
                quoted: message 
            });
        }
    }
};
