module.exports = {
    name: "ping",
    category: "general",
    desc: "Check bot response time",
    handler: async (message, sock, args) => {
        const start = Date.now();
        const jid = message.key.remoteJid;
        
        const sent = await sock.sendMessage(jid, { 
            text: "🏓 PONG!" 
        });
        
        const ping = Date.now() - start;
        
        await sock.sendMessage(jid, {
            text: `⚡ Response Time: ${ping}ms`,
            edit: { remoteJid: sent.key.remoteJid, id: sent.key.id, fromMe: true }
        });
    }
};
