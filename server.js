const http = require('http');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const os = require('os'); // Network interface'lerini almak için



// IP adresini otomatik al
// WiFi IP'sini bulan fonksiyon çook sert
function getWiFiIP() {
    const interfaces = os.networkInterfaces();
    
    // Önce WiFi adaptörünü bul
    for (const name of Object.keys(interfaces)) {
        // WiFi adaptör isimlerini kontrol et
        if (name.includes('Wi-Fi') || 
            name.includes('WiFi') || 
            name.includes('Wireless') || 
            name.includes('WLAN')) {
            
            // Bu adaptördeki IPv4 adresini bul
            const wifi = interfaces[name].find(
                interface => interface.family === 'IPv4' && !interface.internal
            );
            
            if (wifi) {
                return wifi.address;
            }
        }
    }
    
    // WiFi bulunamazsa tüm IP'ler yani alayını
    console.log('\nTüm ağ adaptörleri:');
    Object.keys(interfaces).forEach(name => {
        console.log(`\n${name}:`);
        interfaces[name].forEach(interface => {
            if (interface.family === 'IPv4') {
                console.log(`  ${interface.address} ${interface.internal ? '(internal)' : ''}`);
            }
        });
    });
    
    return '0.0.0.0';
}


const server = http.createServer((req, res) => {
    // CORS headers 
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Ana sayfa için
    if (req.url === '/' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Server Hatası');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    }
    // QR kod oluşturma endpoint'i
    else if (req.url === '/generate-qr' && req.method === 'POST') {
        let body = '';
        
        // Veriyi parça parça al
        req.on('data', chunk => {
            body += chunk.toString();
        });

        // Veri alımı bitince işle
        req.on('end', async () => {
            try {
                const { url } = JSON.parse(body);
                const qr = await qrcode.toDataURL(url);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ qr }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'QR kod oluşturulamadı' }));
            }
        });
    }
    // OPTIONS istekleri için (CORS)
    else if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
    }
    // 404 - Sayfa bulunamadı
    else {
        res.writeHead(404);
        res.end('Sayfa bulunamadı');
    }
});

const PORT = 3000;
const localIP = getWiFiIP();

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n=== QR Kod Uygulaması ===');
    console.log(`Yerel: http://localhost:${PORT}`);
    console.log(`Ağ: http://${localIP}:${PORT}`);
    console.log('========================\n');
});