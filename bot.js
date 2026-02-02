const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
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
            // printQRInTerminal ہٹا دیں، خود handle کریں گے
            browser: ['Chrome', 'Windows', '10.0']
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;
            
            // QR کوڈ handle کریں
            if (qr) {
                console.log('\n' + '='.repeat(50));
                console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
                console.log('='.repeat(50) + '\n');
                
                // Terminal میں QR دکھائیں
                qrcode.generate(qr, { small: true }, (qrcode) => {
                    console.log(qrcode);
                });
                
                // ویب پیج کے لیے بھی save کریں
                console.log('\n📝 QR String (for web display):');
                console.log(qr);
            }
            
            if (connection === 'open') {
                console.log('\n✅ SUCCESS: Connected to WhatsApp!\n');
                
                // Owner کو notification
                const welcomeMsg = `✅ Muzammil MD Bot is now active!\n\n` +
                                  `Mode: ${config.bot.mode}\n` +
                                  `Prefix: ${config.bot.prefix}\n` +
                                  `Heroku App: Running`;
                
                sock.sendMessage(owner.number + '@s.whatsapp.net', { text: welcomeMsg })
                    .then(() => console.log('📨 Notification sent to owner'))
                    .catch(e => console.log('⚠️ Owner notification failed:', e.message));
            }
            
            if (connection === 'close') {
                console.log('🔌 Connection closed, restarting in 10s...');
                setTimeout(startBot, 10000);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Messages handle کریں
        sock.ev.on('messages.upsert', ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            if (text.startsWith(config.bot.prefix)) {
                const cmd = text.slice(config.bot.prefix.length).split(' ')[0].toLowerCase();
                const args = text.split(' ').slice(1);
                
                if (plugins[cmd]) {
                    console.log(`⚡ Command: ${cmd} from ${msg.key.remoteJid}`);
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
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; 
                    margin: 0; 
                    padding: 40px; 
                    text-align: center;
                }
                .container { 
                    background: rgba(255,255,255,0.1); 
                    padding: 40px; 
                    border-radius: 20px; 
                    max-width: 600px;
                    margin: auto;
                }
                h1 { margin-bottom: 20px; }
                .qr-box { 
                    background: white; 
                    color: black; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0;
                    word-break: break-all;
                    font-family: monospace;
                }
                .info { 
                    background: rgba(0,0,0,0.2); 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Muzammil MD WhatsApp Bot</h1>
                <div class="info">🟢 Status: Running on Heroku</div>
                <div class="info">👑 Owner: Muzammil Haqnawaz</div>
                <div class="info">🔧 Prefix: ${config.bot.prefix || '.'}</div>
                <div class="info">📱 Mode: ${config.bot.mode || 'public'}</div>
                
                <h3>📝 How to Connect:</h3>
                <div class="info">
                    1. Check <strong>Heroku logs</strong> for QR code<br>
                    2. Open WhatsApp → Settings → Linked Devices<br>
                    3. Tap "Link a Device" and scan QR<br>
                    4. Bot will auto-connect
                </div>
                
                <h3>📋 To View QR Code:</h3>
                <div class="info">
                    Run this command in terminal:<br>
                    <code>heroku logs --tail --app muzammilmd</code>
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Web Server running on port ${PORT}`);
    console.log(`🤖 Bot Name: ${config.bot.name}`);
    console.log(`👑 Owner: ${owner.name} (${owner.number})`);
    console.log('\n⏳ Waiting for QR code...');
    startBot();
});
