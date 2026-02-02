const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const config = require('./config.js');
const owner = require('./owner.js');
const plugins = require('./loader.js');

console.log('🚀 Muzammil MD Bot Starting...');

async function startBot() {
    try {
        console.log('📁 Loading session...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        console.log('🔗 Connecting to WhatsApp...');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            browser: ['Chrome', 'Windows', '10.0']
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;
            
            if (qr) {
                console.log('\n=========================================');
                console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
                console.log('=========================================\n');
            }
            
            if (connection === 'open') {
                console.log('✅ SUCCESS: Connected to WhatsApp!');
                
                // Send message to owner
                const welcomeMsg = `✅ Muzammil MD Bot is now active!\n\n` +
                                  `Mode: ${config.bot.mode}\n` +
                                  `Prefix: ${config.bot.prefix}\n` +
                                  `Heroku App: Running`;
                
                sock.sendMessage(owner.number + '@s.whatsapp.net', { text: welcomeMsg })
                    .then(() => console.log('📨 Notification sent to owner'))
                    .catch(e => console.log('⚠️ Could not notify owner:', e.message));
            }
            
            if (connection === 'close') {
                console.log('🔌 Connection closed, restarting in 5s...');
                setTimeout(startBot, 5000);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Handle messages
        sock.ev.on('messages.upsert', ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            if (text.startsWith(config.bot.prefix)) {
                const cmd = text.slice(config.bot.prefix.length).split(' ')[0];
                const args = text.split(' ').slice(1);
                
                if (plugins[cmd]) {
                    console.log(`Command: ${cmd} from ${msg.key.remoteJid}`);
                    plugins[cmd].handler(msg, sock, args);
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('🔄 Restarting in 10 seconds...');
        setTimeout(startBot, 10000);
    }
}

// Heroku web server
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
        <head>
            <title>Muzammil MD Bot</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    margin: 0; 
                    padding: 0; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh; 
                    text-align: center;
                }
                .container { 
                    background: rgba(255,255,255,0.1); 
                    padding: 40px; 
                    border-radius: 20px; 
                    backdrop-filter: blur(10px);
                    max-width: 500px;
                    width: 90%;
                }
                h1 { margin-bottom: 10px; }
                .status { 
                    background: rgba(0,0,0,0.2); 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 20px 0;
                    font-size: 18px;
                }
                .info { margin: 10px 0; opacity: 0.9; }
                .note { 
                    margin-top: 25px; 
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Muzammil MD WhatsApp Bot</h1>
                <div class="status">🟢 Bot is running on Heroku</div>
                <div class="info">👑 Owner: Muzammil Haqnawaz</div>
                <div class="info">🔧 Prefix: ${config.bot.prefix || '.'}</div>
                <div class="info">🌐 Mode: ${config.bot.mode || 'public'}</div>
                <div class="note">
                    <strong>📝 Instructions:</strong><br>
                    1. Check Heroku logs for QR code<br>
                    2. Scan with WhatsApp > Linked Devices<br>
                    3. Bot will auto-connect
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Web Server: http://localhost:${PORT}`);
    startBot();
});
