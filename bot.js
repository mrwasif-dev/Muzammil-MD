const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const config = require('./config.js');
const owner = require('./owner.js');
const plugins = require('./loader.js');

// Permission functions
function isOwner(number) {
    return number === owner.number;
}

function isSudo(number) {
    return config.sudo.includes(number) || isOwner(number);
}

function canUseBot(number) {
    if (config.bot.mode === "public") return true;
    return isSudo(number);
}

// Main bot
async function startBot() {
    console.log(`🚀 ${config.bot.name} Starting...`);
    
    const { state, saveCreds } = await useMultiFileAuthState(config.session.savePath);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        
        if (connection === 'close') {
            console.log('🔌 Disconnected, reconnecting...');
            setTimeout(() => startBot(), 5000);
        } 
        else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp!');
            
            // Notify owner
            sock.sendMessage(owner.number + '@s.whatsapp.net', {
                text: `✅ ${config.bot.name} is now active!\nMode: ${config.bot.mode}\nPrefix: ${config.bot.prefix}`
            });
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || jid;
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || '';
        
        // Check permission
        if (!canUseBot(sender)) {
            return sock.sendMessage(jid, {
                text: "❌ Bot is in private mode. Contact owner."
            });
        }
        
        // Check command prefix
        if (text.startsWith(config.bot.prefix)) {
            const command = text.slice(config.bot.prefix.length).split(' ')[0];
            const args = text.trim().split(' ').slice(1);
            
            if (plugins[command]) {
                try {
                    await plugins[command].handler(msg, sock, args);
                } catch (err) {
                    console.log(`❌ ${command} error:`, err.message);
                }
            }
        }
    });
}

// Heroku HTTP server
const PORT = process.env.PORT || 3000;
require('http').createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${config.bot.name} WhatsApp Bot\nOwner: ${owner.name}\nStatus: Running`);
}).listen(PORT, () => {
    console.log(`🌐 Server: http://localhost:${PORT}`);
    startBot();
});
