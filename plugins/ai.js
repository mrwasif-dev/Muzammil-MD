const axios = require('axios');

module.exports = {
    name: "ai",
    category: "ai",
    desc: "Chat with AI (Gemini/OpenAI)",
    handler: async (message, sock, args) => {
        const jid = message.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(jid, { 
                text: `Ask me anything!\nUsage: ${require('../configManager.js').getConfig().bot.prefix}ai <question>`, 
                quoted: message 
            });
        }
        
        try {
            await sock.sendMessage(jid, { text: "🤖 Thinking...", quoted: message });
            
            const question = args.join(' ');
            
            // Using Gemini API (free)
            const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyC-EXAMPLE-KEY', {
                contents: [{
                    parts: [{ text: question }]
                }]
            });
            
            const answer = response.data.candidates[0].content.parts[0].text;
            
            await sock.sendMessage(jid, {
                text: `🤖 *AI Response*\n\n${answer.substring(0, 2000)}`,
                quoted: message
            });
            
        } catch (error) {
            // Fallback to local response
            const responses = [
                "I'm still learning!",
                "Can you rephrase that?",
                "Interesting question!",
                "Let me think about that...",
                "I don't know the answer yet."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            await sock.sendMessage(jid, {
                text: `🤖 ${randomResponse}`,
                quoted: message
            });
        }
    }
};
