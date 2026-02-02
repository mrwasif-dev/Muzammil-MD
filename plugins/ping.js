module.exports = {
    name: "ping",
    handler: async (message, sock, args) => {
        const start = Date.now();
        const jid = message.key.remoteJid;
        
        // پہلا میسج: 🏓 PONG!
        const sent = await sock.sendMessage(jid, { 
            text: "🏓 PONG!" 
        });
        
        const ping = Date.now() - start;
        
        // ایڈٹ کر کے صرف Response Time رکھیں
        await sock.sendMessage(jid, {
            text: `⚡ Response Time: ${ping}ms`,
            edit: { remoteJid: sent.key.remoteJid, id: sent.key.id, fromMe: true }
        });
    }
};
