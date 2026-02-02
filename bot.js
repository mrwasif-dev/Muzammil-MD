const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const config = require('./config.js');
const owner = require('./owner.js');
const plugins = require('./loader.js');

let qrCode = null;
let isConnected = false;

async function startBot() {
    console.log(`🚀 ${config.bot.name} Starting...`);
    
    const { state, saveCreds } = await useMultiFileAuthState(config.session.savePath);
    
    const sock = makeWASocket({
        auth: state,
        // printQRInTerminal ہٹا دیا (deprecated)
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        version: [2, 3000, 1023223821] // Latest version
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        
        // QR کوڈ مل گیا
        if (qr) {
            qrCode = qr;
            console.log('📱 QR Code Received!');
            console.log('Scan this QR with WhatsApp:');
            console.log(qr); // QR کوڈ ٹرمنل میں دکھائیں
        }
        
        if (connection === 'close') {
            console.log('🔌 Disconnected, reconnecting in 10s...');
            setTimeout(() => startBot(), 10000);
        } 
        else if (connection === 'open') {
            isConnected = true;
            console.log('✅ Connected to WhatsApp!');
            
            // Notify owner
            try {
                await sock.sendMessage(owner.number + '@s.whatsapp.net', {
                    text: `✅ ${config.bot.name} is now active!\nMode: ${config.bot.mode}\nPrefix: ${config.bot.prefix}\nHeroku App: Running`
                });
            } catch (err) {
                console.log('Owner notification failed:', err.message);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const jid = msg.key.remoteJid;
            const sender = msg.key.participant || jid;
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            // Check permission
            if (config.bot.mode === 'private') {
                const isAllowed = sender === owner.number || config.sudo.includes(sender);
                if (!isAllowed) return;
            }
            
            // Check command prefix
            if (text.startsWith(config.bot.prefix)) {
                const command = text.slice(config.bot.prefix.length).split(' ')[0].toLowerCase();
                const args = text.trim().split(' ').slice(1);
                
                if (plugins[command]) {
                    console.log(`Command: ${command} from ${sender}`);
                    await plugins[command].handler(msg, sock, args);
                }
            }
        } catch (err) {
            console.log('Message handling error:', err.message);
        }
    });
}

// Heroku HTTP server
const PORT = process.env.PORT || 3000;
require('http').createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    const html = `
    <html>
    <head>
        <title>Muzammil MD Bot</title>
        <style>
            body { font-family: Arial; background: #667eea; color: white; padding: 50px; text-align: center; }
            .container { max-width: 500px; margin: auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
            h1 { margin-bottom: 20px; }
            .status { font-size: 18px; margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px; }
            .qr { margin: 20px 0; padding: 20px; background: white; border-radius: 10px; color: black; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Muzammil MD WhatsApp Bot</h1>
            <div class="status">
                Status: ${isConnected ? '✅ Connected' : '⏳ Waiting for QR Scan'}
            </div>
            ${qrCode ? `<div class="qr"><strong>QR Code:</strong><br><pre>${qrCode}</pre></div>` : ''}
            <p>Check Heroku logs for QR code if not shown here</p>
            <p>Owner: Muzammil Haqnawaz</p>
        </div>
    </body>
    </html>`;
    
    res.end(html);
}).listen(PORT, () => {
    console.log(`🌐 HTTP Server: http://localhost:${PORT}`);
    console.log(`📱 Bot: ${config.bot.name}`);
    console.log(`👑 Owner: ${owner.name}`);
    startBot();
});
