const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const config = require('./config.js');
const owner = require('./owner.js');
const plugins = require('./loader.js');
const fs = require('fs');
const path = require('path');

console.log('🚀 Muzammil MD Bot Starting...');

let currentQR = null;
let isConnected = false;
let sessionExists = fs.existsSync(path.join(__dirname, 'auth_info', 'creds.json'));
let qrImageData = null;

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

        sock.ev.on('connection.update', async (update) => {
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
                
                // ویب کے لیے QR image بنائیں
                try {
                    qrImageData = await QRCode.toDataURL(qr);
                    console.log('🖼️ QR image generated for web');
                } catch (err) {
                    console.log('⚠️ QR image generation failed:', err.message);
                }
            }
            
            if (connection === 'open') {
                isConnected = true;
                currentQR = null;
                qrImageData = null;
                sessionExists = true;
                console.log('\n✅ SUCCESS: Connected to WhatsApp!\n');
                console.log('💾 Session saved for future use');
                
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
    } else if (sessionExists && !currentQR) {
        status = '🔄 Reconnecting';
        message = 'Session Activated - Already connected';
        qrDisplay = '';
    } else if (currentQR && qrImageData) {
        status = '📱 Scan QR Code';
        message = 'Please scan this QR code with WhatsApp';
        qrDisplay = `
            <div class="qr-section">
                <h3><i class="fas fa-qrcode"></i> Scan QR Code</h3>
                <div class="qr-container">
                    <img src="${qrImageData}" alt="WhatsApp QR Code" class="qr-image">
                    <div class="qr-text">${currentQR.substring(0, 60)}...</div>
                </div>
                <div class="instructions">
                    <h4><i class="fas fa-mobile-alt"></i> How to Scan:</h4>
                    <ol>
                        <li>Open <strong>WhatsApp</strong> on your phone</li>
                        <li>Tap <strong>Settings → Linked Devices</strong></li>
                        <li>Tap <strong>Link a Device</strong></li>
                        <li>Point your camera at the QR code</li>
                        <li>Wait for connection confirmation</li>
                    </ol>
                    <p class="note"><i class="fas fa-info-circle"></i> QR will auto-refresh every 30 seconds</p>
                </div>
            </div>
        `;
    } else if (currentQR) {
        status = '📱 Scan QR Code';
        message = 'Please scan this QR code with WhatsApp';
        qrDisplay = `
            <div class="qr-section">
                <h3><i class="fas fa-qrcode"></i> Scan QR Code</h3>
                <div class="qr-container">
                    <div class="qr-fallback">
                        <p><i class="fas fa-exclamation-triangle"></i> QR Image could not be generated</p>
                        <p>Scan this code manually:</p>
                        <div class="qr-code-text">${currentQR}</div>
                    </div>
                </div>
                <div class="instructions">
                    <h4><i class="fas fa-mobile-alt"></i> How to Scan Manually:</h4>
                    <ol>
                        <li>Open WhatsApp Web/Desktop on your computer</li>
                        <li>Click on <strong>Link with phone number</strong></li>
                        <li>Select <strong>Link with QR code</strong></li>
                        <li>Enter this code manually</li>
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
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 900px;
                width: 100%;
                box-shadow: 0 25px 70px rgba(0,0,0,0.3);
                text-align: center;
            }
            .header {
                margin-bottom: 30px;
                border-bottom: 2px solid #f0f0f0;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #333;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                font-size: 2.2em;
            }
            .header h1 i {
                color: #25D366;
            }
            .status-card {
                background: linear-gradient(135deg, #f8f9ff 0%, #eef1ff 100%);
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
                border-left: 6px solid #667eea;
                text-align: center;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.1);
            }
            .status-icon {
                font-size: 60px;
                margin-bottom: 20px;
                color: #667eea;
            }
            .status-text {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                color: #333;
            }
            .status-message {
                color: #666;
                font-size: 18px;
                line-height: 1.5;
            }
            .qr-section {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin: 30px 0;
                border: 3px solid #25D366;
                box-shadow: 0 15px 40px rgba(37, 211, 102, 0.2);
            }
            .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                margin: 20px 0;
            }
            .qr-image {
                width: 300px;
                height: 300px;
                border: 10px solid white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .qr-text {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
                max-width: 100%;
                color: #555;
                border: 1px solid #ddd;
            }
            .qr-fallback {
                padding: 30px;
                background: #fff9e6;
                border-radius: 15px;
                border: 2px dashed #ff9800;
            }
            .qr-code-text {
                background: white;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                word-break: break-all;
                font-size: 14px;
                margin: 15px 0;
                border: 1px solid #ddd;
                text-align: left;
                max-height: 200px;
                overflow-y: auto;
            }
            .instructions {
                text-align: left;
                margin-top: 25px;
                padding: 25px;
                background: #f0f8ff;
                border-radius: 15px;
                border-left: 5px solid #2196F3;
            }
            .instructions h4 {
                color: #2196F3;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .instructions ol {
                margin-left: 25px;
                margin-top: 15px;
            }
            .instructions li {
                margin-bottom: 12px;
                font-size: 16px;
                line-height: 1.6;
            }
            .note {
                margin-top: 20px;
                padding: 15px;
                background: #e8f5e9;
                border-radius: 10px;
                color: #2e7d32;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 40px;
            }
            .info-box {
                background: linear-gradient(135deg, #f8f9ff 0%, #eef1ff 100%);
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                border: 2px solid #e0e0e0;
                transition: transform 0.3s, border-color 0.3s;
            }
            .info-box:hover {
                transform: translateY(-5px);
                border-color: #667eea;
            }
            .info-label {
                font-size: 14px;
                color: #667eea;
                font-weight: 600;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .info-value {
                font-size: 22px;
                font-weight: 700;
                color: #333;
            }
            .connected {
                border-left-color: #4CAF50;
                background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
            }
            .connected .status-icon {
                color: #4CAF50;
            }
            .session-active {
                background: linear-gradient(135deg, #e8f5e9 0%, #d0f0c0 100%);
                border-left-color: #4CAF50;
            }
            .footer {
                margin-top: 40px;
                padding-top: 25px;
                border-top: 2px solid #eee;
                color: #666;
                font-size: 15px;
                line-height: 1.6;
            }
            .footer i {
                color: #667eea;
                margin: 0 5px;
            }
            @media (max-width: 768px) {
                .container { padding: 25px; }
                .status-text { font-size: 24px; }
                .qr-image { width: 250px; height: 250px; }
                .info-grid { grid-template-columns: 1fr; }
                .header h1 { font-size: 1.8em; flex-direction: column; }
            }
            @media (max-width: 480px) {
                .container { padding: 20px; }
                .qr-image { width: 200px; height: 200px; }
                .status-text { font-size: 20px; }
            }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><i class="fab fa-whatsapp"></i> Muzammil MD WhatsApp Bot</h1>
                <p style="color: #666; font-size: 18px;">Advanced WhatsApp Bot by Muzammil Haqnawaz</p>
            </div>
            
            <div class="status-card ${isConnected ? 'connected' : ''} ${sessionExists && !currentQR ? 'session-active' : ''}">
                <div class="status-icon">
                    ${isConnected ? '<i class="fas fa-check-circle"></i>' : 
                      currentQR ? '<i class="fas fa-qrcode"></i>' : 
                      '<i class="fas fa-sync-alt fa-spin"></i>'}
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
                    <div class="info-label">Session Status</div>
                    <div class="info-value">${sessionExists ? '💾 Activated' : '❌ Not Found'}</div>
                </div>
            </div>
            
            <div class="footer">
                <p><i class="fas fa-user"></i> <strong>Owner:</strong> Muzammil Haqnawaz | <i class="fas fa-phone"></i> <strong>Contact:</strong> ${owner.number}</p>
                <p style="margin-top: 15px; font-size: 14px; color: #777;">
                    <i class="fas fa-shield-alt"></i> Secure Connection • 
                    <i class="fas fa-save"></i> Auto-save Session •
                    <i class="fas fa-redo"></i> Auto-reconnect •
                    <i class="fas fa-bolt"></i> Real-time Updates
                </p>
            </div>
        </div>
        
        <script>
            // Auto-refresh every 30 seconds if QR is shown
            if(${currentQR ? 'true' : 'false'}) {
                setTimeout(() => {
                    console.log('🔄 Refreshing page for new QR...');
                    location.reload();
                }, 30000);
            }
            
            // Auto-refresh every 10 seconds if connecting
            if(${!isConnected && !currentQR ? 'true' : 'false'}) {
                setTimeout(() => location.reload(), 10000);
            }
        </script>
    </body>
    </html>
    `;
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
