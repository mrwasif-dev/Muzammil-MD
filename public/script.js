const socket = io();

socket.on('connect', () => {
    console.log('Connected to bot server');
});

socket.on('qr', (qrCode) => {
    document.getElementById('status').textContent = '📱 Scan QR Code';
    document.getElementById('qr-container').classList.remove('hidden');
    document.getElementById('connected-container').classList.add('hidden');
    
    // Generate QR code
    document.getElementById('qrcode').innerHTML = '';
    QRCode.toCanvas(document.getElementById('qrcode'), qrCode, {
        width: 200,
        margin: 2
    }, function(error) {
        if (error) console.error(error);
    });
});

socket.on('connected', (data) => {
    document.getElementById('status').textContent = '✅ Connected';
    document.getElementById('qr-container').classList.add('hidden');
    document.getElementById('connected-container').classList.remove('hidden');
    document.getElementById('sessionInfo').textContent = 'Active - ' + new Date().toLocaleTimeString();
    
    if (data.botName) {
        document.getElementById('botMode').textContent = data.mode || 'public';
        document.getElementById('botPrefix').textContent = data.prefix || '.';
    }
});

socket.on('sessionStatus', (status) => {
    document.getElementById('sessionStatus').innerHTML = 
        `<p>${status}</p>`;
});

socket.on('error', (error) => {
    document.getElementById('status').textContent = '❌ Error: ' + error;
});
