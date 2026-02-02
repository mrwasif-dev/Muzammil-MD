const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config.js');
const owner = require('./owner.js');
const plugins = require('./loader.js');
const fs = require('fs');
const path = require('path');

console.log('🚀 Muzammil MD Bot Starting...');

let currentQR = null;
let isConnected = false;
let sessionExists = fs.existsSync(path.join(__dirname, 'auth_info', 'creds.json'));

async function startBot() {
    try {
        console.log('📁 Loading session...');
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        console.log('🔗 Connecting to WhatsApp...');
        const sock = makeWASocket({
            auth: state,
            browser: ['Chrome', 'Windows', '10.0'],
            version: [2, 3000, 1]
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;
            
            // QR کوڈ handle کریں
            if (qr) {
                currentQR = qr;
                console.log('\n' + '='.repeat(50));
                console.log('📱 SCAN THIS QR CODE WITH WHATSAPP');
                console.log('='.repeat(50) + '\n');
                
                // Terminal میں QR دکھائیں
                qrcode.generate(qr, { small: true }, (qrcodeText) => {
                    console.log(qrcodeText);
                });
                
                console.log('\n🔗 QR String:');
                console.log(qr.substring(0, 80) + '...');
                
                // ویب پیج کو اپ ڈیٹ کرنے کے لیے
                updateWebPage();
            }
            
            if (connection === 'open') {
                isConnected = true;
                currentQR = null;
                sessionExists = true;
                console.log('\n✅ SUCCESS: Connected to WhatsApp!\n');
                console.log('💾 Session saved for future use');
                
                // ویب پیج اپ ڈیٹ
                updateWebPage();
                
                // Owner کو notification
                const welcomeMsg = `✅ Muzammil MD Bot is now active!\n\n` +
                                  `Mode: ${config.bot.mode}\n` +
                                  `Prefix: ${config.bot.prefix}\n` +
                                  `Session: Saved`;
                
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

// ویب پیج کا HTML
function getWebPage() {
    let status, message, qrDisplay;
    
    if (isConnected) {
        status = '✅ Connected';
        message = 'Session is active and bot is running';
        qrDisplay = '';
    } else if (sessionExists) {
        status = '🔄 Reconnecting';
        message = 'Session found, reconnecting to WhatsApp...';
        qrDisplay = '';
    } else if (currentQR) {
        status = '📱 Scan QR Code';
        message = 'Please scan this QR code with WhatsApp';
        qrDisplay = `
            <div class="qr-section">
                <h3>QR Code for Linking Device</h3>
                <div class="qr-box">${currentQR}</div>
                <div class="instructions">
                    <h4>📋 How to Scan:</h4>
                    <ol>
                        <li>Open WhatsApp on your phone</li>
                        <li>Tap <strong>Settings → Linked Devices</strong></li>
                        <li>Tap <strong>Link a Device</strong></li>
                        <li>Point your camera at this QR code</li>
                    </ol>
                </div>
            </div>
        `;
    } else {
        status = '⏳ Initializing';
        message = 'Bot is starting, please wait...';
        qrDisplay = '';
    }
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Muzammil MD WhatsApp Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 800px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
            }
            .header {
                margin-bottom: 30px;
            }
            .header h1 {
                color: #333;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
            }
            .header h1 i {
                color: #667eea;
            }
            .status-card {
                background: #f8f9ff;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 5px solid #667eea;
            }
            .status-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .status-text {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #333;
            }
            .status-message {
                color: #666;
                font-size: 16px;
            }
            .qr-section {
                background: white;
                border-radius: 15px;
                padding: 25px;
                margin: 25px 0;
                border: 2px dashed #667eea;
            }
            .qr-box {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                word-break: break-all;
                font-size: 14px;
                margin: 20px 0;
                text-align: left;
                border: 1px solid #ddd;
            }
            .instructions {
                text-align: left;
                margin-top: 20px;
                padding: 20px;
                background: #f0f4ff;
                border-radius: 10px;
            }
            .instructions ol {
                margin-left: 20px;
                margin-top: 10px;
            }
            .instructions li {
                margin-bottom: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 30px;
            }
            .info-box {
                background: #f8f9ff;
                padding: 15px;
                border-radius: 10px;
                text-align: center;
            }
            .info-label {
                font-size: 12px;
                color: #667eea;
                font-weight: 600;
                margin-bottom: 5px;
            }
            .info-value {
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            .connected {
                border-left-color: #4cd964;
            }
            .connected .status-icon {
                color: #4cd964;
            }
            .session-active {
                background: #f0fff4;
                border-left-color: #4cd964;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #777;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                .container { padding: 20px; }
                .status-text { font-size: 20px; }
                .info-grid { grid-template-columns: 1fr; }
            }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fas fa-robot"></i> Muzammil MD WhatsApp Bot</h1>
                <p>Advanced WhatsApp Bot by Muzammil Haqnawaz</p>
            </div>
            
            <div class="status-card ${isConnected ? 'connected' : ''} ${sessionExists && !currentQR ? 'session-active' : ''}">
                <div class="status-icon">
                    ${isConnected ? '<i class="fas fa-check-circle"></i>' : 
                      currentQR ? '<i class="fas fa-qrcode"></i>' : 
                      '<i class="fas fa-sync-alt"></i>'}
                </div>
                <div class="status-text">${status}</div>
                <div class="status-message">${message}</div>
            </div>
            
            ${qrDisplay}
            
            <div class="info-grid">
                <div class="info-box">
                    <div class="info-label">Bot Name</div>
                    <div class="info-value">${config.bot.name}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Command Prefix</div>
                    <div class="info-value">${config.bot.prefix}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Mode</div>
                    <div class="info-value">${config.bot.mode}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Session</div>
                    <div class="info-value">${sessionExists ? '💾 Saved' : '❌ Not Found'}</div>
                </div>
            </div>
            
            <div class="footer">
                <p><i class="fas fa-user"></i> Owner: Muzammil Haqnawaz | <i class="fas fa-phone"></i> ${owner.number}</p>
                <p style="margin-top: 10px; font-size: 12px;">
                    <i class="fas fa-shield-alt"></i> Secure Connection • 
                    <i class="fas fa-save"></i> Auto-save Session •
                    <i class="fas fa-redo"></i> Auto-reconnect
                </p>
            </div>
        </div>
        
        <script>
            // Auto-refresh every 5 seconds if QR is shown
            if(${currentQR ? 'true' : 'false'}) {
                setTimeout(() => location.reload(), 5000);
            }
        </script>
    </body>
    </html>
    `;
}

// ویب پیج اپ ڈیٹ فنکشن
function updateWebPage() {
    // ویب پیج اپ ڈیٹ ہو جائے گا جب کوئی صفحہ کھلے گا
}

// Heroku web server
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getWebPage());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Web Server: http://localhost:${PORT}`);
    console.log(`🤖 Bot: ${config.bot.name}`);
    console.log(`👑 Owner: ${owner.name} (${owner.number})`);
    
    if (sessionExists) {
        console.log('💾 Session found, reconnecting...');
    } else {
        console.log('❌ No session found, waiting for QR scan...');
    }
    
    startBot();
});
