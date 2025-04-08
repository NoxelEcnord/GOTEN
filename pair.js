//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Store pairing requests
const pairingRequests = new Map();

// HTML form for pairing
const pairForm = `
<!DOCTYPE html>
<html>
<head>
    <title>GOTEN Bot Pairing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #25D366;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #128C7E;
        }
        #result {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>GOTEN Bot Pairing</h1>
        <p>Enter your phone number below (with country code)</p>
        <form id="pairForm">
            <input type="text" id="phone" placeholder="e.g., 1234567890" required>
            <button type="submit">Pair</button>
        </form>
        <div id="result"></div>
    </div>
    <script>
        document.getElementById('pairForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('phone').value;
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await fetch('/pair', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.className = 'success';
                    resultDiv.innerHTML = '<h3>Pairing Successful!</h3><p>Please check your WhatsApp for the session ID and deployment instructions.</p>';
                } else {
                    resultDiv.className = 'error';
                    resultDiv.innerHTML = 'Error: ' + data.error;
                }
            } catch (error) {
                resultDiv.className = 'error';
                resultDiv.innerHTML = 'Error: ' + error.message;
            }
        });
    </script>
</body>
</html>
`;

// Generate TTS message
async function generateTTS(text) {
    try {
        const outputFile = `./temp/${Date.now()}.mp3`;
        await execAsync(`gtts-cli "${text}" --output ${outputFile}`);
        return outputFile;
    } catch (error) {
        console.error('TTS Error:', error);
        return null;
    }
}

// Add encryption function
function encryptSessionId(sessionId) {
    const key = 'GOTEN_BOT_2025';
    let encrypted = '';
    for (let i = 0; i < sessionId.length; i++) {
        const charCode = sessionId.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
    }
    return Buffer.from(encrypted).toString('base64');
}

// Serve the pairing form
app.get('/pair', (req, res) => {
    res.send(pairForm);
});

// Handle pairing request
app.post('/pair', async (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.json({ success: false, error: 'Phone number is required' });
    }

    try {
        // Generate a unique session ID
        const sessionId = `GOTEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initialize WhatsApp connection
        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' })
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    // Reconnect logic here
                }
            } else if (connection === 'open') {
                // Save credentials when connected
                await saveCreds();
                pairingRequests.set(phone, { sessionId, connected: true });

                // Generate TTS message
                const ttsFile = await generateTTS("GOTEN Bot connected successfully. Please proceed with deployment on your favorite panel.");
                
                // Send main message
                const message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃      GOTEN BOT      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

✅ Connected Successfully!

📱 Your Session ID will be sent in the next message for easy copy-pasting.

📝 Deployment Instructions:
1. Copy the Session ID from the next message
2. Go to your Heroku dashboard
3. Add this as SESSION_ID in config vars
4. Deploy your bot

🔗 Support:
• Telegram: t.me/botGOTEN
• WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6
• WhatsApp Channel: https://whatsapp.com/channel/0029VaevRgSEwEjnvksGQp2K`;

                // Send text message
                await sock.sendMessage(phone + '@s.whatsapp.net', { text: message });
                
                // Send encrypted session ID in a separate message
                const encryptedSessionId = encryptSessionId(sessionId);
                await sock.sendMessage(phone + '@s.whatsapp.net', { 
                    text: `🔐 Encrypted Session ID (Copy this):\n${encryptedSessionId}` 
                });
                
                // Send TTS message if generated
                if (ttsFile) {
                    await sock.sendMessage(phone + '@s.whatsapp.net', {
                        audio: { url: ttsFile },
                        mimetype: 'audio/mp4',
                        ptt: true
                    });
                    // Clean up TTS file
                    fs.unlinkSync(ttsFile);
                }
            }
        });

        // Store the pairing request
        pairingRequests.set(phone, { sessionId, connected: false });

        // Return success to user
        res.json({ 
            success: true,
            message: 'Please scan the QR code in your terminal to complete pairing'
        });

    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Create temp directory for TTS files
if (!fs.existsSync('./temp')) {
    fs.mkdirSync('./temp');
}

// Start server
app.listen(PORT, () => {
    console.log(`Pairing server running at http://localhost:${PORT}/pair`);
});

//=====================//
//     © 2025          //
//=====================// 