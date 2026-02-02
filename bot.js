const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const configManager = require('./configManager.js');
const sessionManager = require('./sessionManager.js');
const WebServer = require('./webServer.js');
const owner = require('./owner.js');

console.log('🚀 Muzammil MD Bot Starting...');

// Bot state
const botState = {
    currentQR: null,
    qrImageData: null,
    isConnected: false
};

// Start web server
const webServer = new WebServer(botState);
webServer.start();

// Load all plugins
const fs = require('fs');
const plugins = {};
if (fs.existsSync('./plugins')) {
    fs.readdirSync('./plugins')
        .filter(f => f.endsWith('.js'))
        .forEach(file => {
            const name = file.replace('.js', '');
            try {
                plugins[name] = require(`./plugins/${file}`);
                console.log(`✅ Plugin: ${name}`);
            } catch (e) {
                console.log(`❌ Plugin ${name} error:`, e.message);
            }
        });
}

console.log(`📦 Total plugins: ${Object.keys(plugins).length}`);

async function startBot() {
    try {
        const config = configManager.getConfig();
        console.log(`🤖 Bot: ${config.bot.name}`);
        console.log(`🔧 Prefix: ${config.bot.prefix}`);
        console.log(`🔐 Mode: ${config.bot.mode}`);
        
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        const sock = makeWASocket({
            auth: state,
            browser: ['Chrome', 'Windows', '10.0'],
            version: [2, 3000, 1]
        });

        // Auto features handler
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const jid = msg.key.remoteJid;
            const sender = msg.key.participant || jid;
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            // Auto reaction
            if (config.autoSettings.autoReaction && text) {
                const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
                const randomReact = reactions[Math.floor(Math.random() * reactions.length)];
                await sock.sendMessage(jid, { react: { text: randomReact, key: msg.key } });
            }
            
            // Auto reply to status
            if (config.autoSettings.autoReplyStatus && jid.endsWith('@status')) {
                await sock.sendMessage(jid, { text: 'Nice status! 👌' });
            }
        });

        sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;
            
            if (qr) {
                botState.currentQR = qr;
                console.log('\n' + '='.repeat(40));
                console.log('📱 SCAN QR WITH WHATSAPP');
                console.log('='.repeat(40));
                
                qrcode.generate(qr, { small: true }, (qrText) => {
                    console.log(qrText);
                });
                
                webServer.generateQRImage(qr).then(img => {
                    botState.qrImageData = img;
                });
            }
            
            if (connection === 'open') {
                botState.isConnected = true;
                botState.currentQR = null;
                botState.qrImageData = null;
                
                console.log('\n✅ CONNECTED TO WHATSAPP');
                console.log('💾 SESSION ACTIVATED');
                
                const msg = `✅ ${config.bot.name} Active\nMode: ${config.bot.mode}\nPrefix: ${config.bot.prefix}`;
                sock.sendMessage(owner.number + '@s.whatsapp.net', { text: msg })
                    .catch(e => console.log('Notify error:', e.message));
            }
            
            if (connection === 'close') {
                console.log('🔌 Disconnected, restarting...');
                setTimeout(startBot, 10000);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Handle commands
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const jid = msg.key.remoteJid;
            const sender = msg.key.participant || jid;
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            // Check permissions
            if (config.bot.mode === 'private') {
                const isAllowed = sender === owner.number || config.sudo.includes(sender);
                if (!isAllowed) return;
            }
            
            // Check for command
            if (text.startsWith(config.bot.prefix)) {
                const cmd = text.slice(config.bot.prefix.length).split(' ')[0].toLowerCase();
                const args = text.split(' ').slice(1);
                
                if (plugins[cmd]) {
                    console.log(`Command: ${cmd} from ${sender}`);
                    try {
                        await plugins[cmd].handler(msg, sock, args);
                    } catch (error) {
                        console.log(`❌ ${cmd} error:`, error.message);
                        await sock.sendMessage(jid, { 
                            text: `❌ Error in command: ${error.message}`, 
                            quoted: msg 
                        });
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('🔄 Restarting in 10s...');
        setTimeout(startBot, 10000);
    }
}

// Start bot
startBot();
