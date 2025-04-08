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
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
    // Allow requests from any origin in development
    // In production, you should specify your static site URL
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.STATIC_SITE_URL || 'https://your-static-site.onrender.com'
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'GOTEN-pairing' });
});

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
        const say = require('say');
        const fs = require('fs');
        const outputFile = `./temp/${Date.now()}.wav`;
        
        // Create a promise-based wrapper for the say.export function
        return new Promise((resolve, reject) => {
            say.export(text, 'Microsoft David', 1.0, outputFile, (err) => {
                if (err) {
                    console.error('TTS Error:', err);
                    reject(err);
                } else {
                    resolve(outputFile);
                }
            });
        });
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

// Add decryption function for verification
function decryptSessionId(encryptedSessionId) {
    const key = 'GOTEN_BOT_2025';
    const decoded = Buffer.from(encryptedSessionId, 'base64').toString();
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
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

📱 Your Session ID for Heroku deployment is in the next message.

📝 Heroku Deployment Instructions:
1. Copy the Session ID from the next message
2. Go to your Heroku dashboard
3. Create a new app
4. Add SESSION_ID as an environment variable
5. Deploy your bot

🔹 Important Note:
This session ID is ONLY for deploying the actual bot on Heroku.
This Render service is just for generating the session ID.

🔗 Support:
• Telegram: t.me/botGOTEN
• WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6`;

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
                        mimetype: 'audio/wav',
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

// Add a route for Render.com session generation
app.get('/render-session', (req, res) => {
    // HTML form for Render.com pairing
    const renderForm = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GOTEN Bot Session Generator</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }
            input[type="text"] {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            button {
                background-color: #6c84fa; /* Render color */
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: #5a70d6;
            }
            #result, #pairing-container {
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
            .session-box, .pairing-code {
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
                word-break: break-all;
                font-family: monospace;
                font-size: 20px;
                text-align: center;
                letter-spacing: 3px;
            }
            .copy-btn {
                background-color: #6c757d;
                color: white;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-bottom: 10px;
            }
            .instructions {
                background-color: #e9ecef;
                padding: 15px;
                border-radius: 4px;
                margin-top: 20px;
            }
            .instructions h3 {
                margin-top: 0;
            }
            .instructions ol {
                padding-left: 20px;
            }
            .loading {
                text-align: center;
                margin: 20px 0;
            }
            .loading-spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #6c84fa;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 2s linear infinite;
                margin: 0 auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .steps {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
            }
            .steps h3 {
                margin-top: 0;
                color: #6c84fa;
            }
            .step {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px dashed #ddd;
            }
            .step:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .step-num {
                display: inline-block;
                background-color: #6c84fa;
                color: white;
                width: 24px;
                height: 24px;
                text-align: center;
                border-radius: 50%;
                margin-right: 10px;
            }
            #pairing-form-container, #pair-code-container {
                transition: all 0.3s ease;
            }
            .hidden {
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>GOTEN Bot Session Generator</h1>
            <div class="steps">
                <h3>How This Works</h3>
                <div class="step">
                    <span class="step-num">1</span> Enter your WhatsApp phone number (with country code)
                </div>
                <div class="step">
                    <span class="step-num">2</span> You'll receive a pairing code to link with WhatsApp
                </div>
                <div class="step">
                    <span class="step-num">3</span> Once paired, you'll receive a session ID on your WhatsApp
                </div>
                <div class="step">
                    <span class="step-num">4</span> Use this session ID for your Heroku deployment
                </div>
            </div>
            
            <div class="note" style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 20px; color: #856404;">
                <strong>Important:</strong> This service is only for generating session IDs. You will deploy your actual GOTEN Bot on Heroku, not on Render.com.
            </div>
            
            <div id="pairing-form-container">
                <form id="renderForm">
                    <input type="text" id="phone" placeholder="Your WhatsApp number (with country code, e.g., 1234567890)" required>
                    <button type="submit">Generate Pairing Code</button>
                </form>
                <div id="pairing-result"></div>
            </div>
            
            <div id="pair-code-container" class="hidden">
                <h3>WhatsApp Pairing Code</h3>
                <p>Open WhatsApp on your phone, go to Settings > Linked Devices > Link a Device, and enter this code:</p>
                <div class="pairing-code" id="pairing-code"></div>
                <button class="copy-btn" onclick="copyToClipboard('pairing-code')">Copy Code</button>
                <div id="pairing-status" class="loading">
                    <p>Waiting for you to enter the code in WhatsApp...</p>
                    <div class="loading-spinner"></div>
                </div>
            </div>
        </div>
        
        <div id="result"></div>
        
        <script>
            const pairingFormContainer = document.getElementById('pairing-form-container');
            const pairCodeContainer = document.getElementById('pair-code-container');
            const pairingResult = document.getElementById('pairing-result');
            const pairingStatus = document.getElementById('pairing-status');
            const pairingCode = document.getElementById('pairing-code');
            const resultDiv = document.getElementById('result');
            
            // Function to check pairing status
            function checkPairingStatus(requestId) {
                fetch('/check-render-pairing-status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ requestId })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.paired) {
                        // Show success message with session ID
                        pairingStatus.innerHTML = '<p>Successfully paired with WhatsApp! Check your messages.</p>';
                        pairingStatus.className = 'success';
                        
                        resultDiv.className = 'container success';
                        resultDiv.innerHTML = 
                            '<h3>Pairing Successful!</h3>' +
                            '<p>WhatsApp has been successfully paired, and the session ID has been sent to your WhatsApp.</p>' +
                            '<div class="instructions">' +
                                '<h3>Heroku Deployment Instructions:</h3>' +
                                '<ol>' +
                                    '<li>Check your WhatsApp for the encrypted session ID message</li>' +
                                    '<li>Copy the encrypted session ID from that message</li>' +
                                    '<li>Go to your Heroku dashboard</li>' +
                                    '<li>Create a new app for your GOTEN bot</li>' +
                                    '<li>Add the following environment variable:' +
                                        '<ul>' +
                                            '<li><strong>SESSION_ID</strong>: Your copied session ID</li>' +
                                        '</ul>' +
                                    '</li>' +
                                    '<li>Deploy your bot to Heroku</li>' +
                                '</ol>' +
                                '<p><strong>Remember:</strong> This Render service is only for generating the session ID. The actual bot should be deployed on Heroku.</p>' +
                            '</div>';
                    } else if (data.error) {
                        // Show error message
                        pairingStatus.innerHTML = '<p>Error: ' + data.error + '</p>';
                        pairingStatus.className = 'error';
                    } else {
                        // Still waiting, check again in 3 seconds
                        setTimeout(() => checkPairingStatus(requestId), 3000);
                    }
                })
                .catch(error => {
                    console.error('Error checking pairing status:', error);
                    pairingStatus.innerHTML = '<p>Error checking pairing status. Please try again.</p>';
                    pairingStatus.className = 'error';
                });
            }
            
            document.getElementById('renderForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('phone').value;
                pairingResult.innerHTML = '<div class="loading"><p>Generating pairing code, please wait...</p><div class="loading-spinner"></div></div>';
                
                try {
                    const response = await fetch('/render-pair', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phone })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.pairingCode) {
                        // Hide the form and show the pairing code
                        pairingFormContainer.classList.add('hidden');
                        pairCodeContainer.classList.remove('hidden');
                        
                        // Display the pairing code
                        pairingCode.textContent = data.pairingCode;
                        
                        // Start checking for pairing status
                        checkPairingStatus(data.requestId);
                    } else {
                        pairingResult.className = 'error';
                        pairingResult.innerHTML = 'Error: ' + (data.error || 'Failed to generate pairing code');
                    }
                } catch (error) {
                    pairingResult.className = 'error';
                    pairingResult.innerHTML = 'Error: ' + error.message;
                }
            });
            
            function copyToClipboard(elementId) {
                const element = document.getElementById(elementId);
                const text = element.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    alert('Copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(renderForm);
});

// Handle Render.com pairing request
app.post('/render-pair', async (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.json({ success: false, error: 'Phone number is required' });
    }

    try {
        // Generate a unique session ID specifically for deployment
        const sessionId = `GOTEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        // Initialize WhatsApp connection with pairing code support
        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['GOTEN Bot', 'Chrome', '1.0.0'],
            mobile: false
        });

        // Track successful pairing
        let pairingCode = '';
        let hasSentSessionId = false;
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    console.log(`Connection closed for ${phone}, reconnecting...`);
                }
            } else if (connection === 'open') {
                // Save credentials when connected
                await saveCreds();
                console.log(`Successfully connected for ${phone}`);
                
                // Update the pairing request
                pairingRequests.set(requestId, { 
                    sessionId, 
                    phone,
                    connected: true, 
                    hasSentSessionId: false,
                    timestamp: Date.now()
                });

                if (!hasSentSessionId) {
                    hasSentSessionId = true;
                    
                    // Generate TTS message
                    const ttsFile = await generateTTS("GOTEN Bot connected successfully. Your session ID has been generated.");
                    
                    // Send main message
                    const message = `╭━━━━━━━━━━━━━━━━━━━━╮
┃      GOTEN BOT      ┃
╰━━━━━━━━━━━━━━━━━━━━╯

✅ Connected Successfully!

📱 Your Session ID for Heroku deployment is in the next message.

📝 Heroku Deployment Instructions:
1. Copy the Session ID from the next message
2. Go to your Heroku dashboard
3. Create a new app
4. Add SESSION_ID as an environment variable
5. Deploy your bot

🔹 Important Note:
This session ID is ONLY for deploying the actual bot on Heroku.
This service is just for generating the session ID.

🔗 Support:
• Telegram: t.me/botGOTEN
• WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6`;

                    // Send text message
                    await sock.sendMessage(phone + '@s.whatsapp.net', { text: message });
                    
                    // Send audio message if TTS file was generated
                    if (ttsFile) {
                        await sock.sendMessage(phone + '@s.whatsapp.net', { 
                            audio: { url: ttsFile }, 
                            mimetype: 'audio/wav',
                            ptt: true
                        });
                        fs.unlinkSync(ttsFile); // Clean up
                    }
                    
                    // Send encrypted session ID in a separate message
                    const encryptedSessionId = encryptSessionId(sessionId);
                    console.log(`Generated session ID: ${sessionId}`);
                    console.log(`Encrypted session ID: ${encryptedSessionId}`);
                    
                    // Test decryption to verify
                    try {
                        const decrypted = decryptSessionId(encryptedSessionId);
                        if (decrypted === sessionId) {
                            console.log('Encryption verification successful');
                        } else {
                            console.error('Encryption verification failed');
                        }
                    } catch (error) {
                        console.error('Decryption test failed:', error);
                    }
                    
                    await sock.sendMessage(phone + '@s.whatsapp.net', { 
                        text: `🔐 Session ID (Copy this):\n${encryptedSessionId}` 
                    });
                    
                    // Update the request to indicate session ID was sent
                    pairingRequests.set(requestId, { 
                        ...pairingRequests.get(requestId),
                        hasSentSessionId: true
                    });
                }
            }
        });
        
        // Request pairing code
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phone);
                pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`Generated pairing code for ${phone}: ${pairingCode}`);
                
                // Store the pairing request with the code
                pairingRequests.set(requestId, { 
                    sessionId,
                    phone, 
                    pairingCode,
                    connected: false,
                    hasSentSessionId: false,
                    timestamp: Date.now()
                });
                
                // Send the pairing code to the client
                res.json({
                    success: true,
                    pairingCode,
                    requestId
                });
            } catch (error) {
                console.error('Error requesting pairing code:', error);
                res.json({
                    success: false,
                    error: error.message || 'Failed to generate pairing code'
                });
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error generating session:', error);
        res.json({
            success: false,
            error: error.message || 'Failed to generate session'
        });
    }
});

// Add endpoint to check pairing status
app.post('/check-render-pairing-status', (req, res) => {
    const { requestId } = req.body;
    
    if (!requestId) {
        return res.json({ success: false, error: 'Request ID is required' });
    }
    
    const pairingRequest = pairingRequests.get(requestId);
    
    if (!pairingRequest) {
        return res.json({ success: false, error: 'Invalid or expired request' });
    }
    
    // Check if the pairing has been completed
    if (pairingRequest.connected) {
        return res.json({ 
            success: true, 
            paired: true
        });
    }
    
    // Check if the request has expired (15 minutes)
    const now = Date.now();
    if (now - pairingRequest.timestamp > 15 * 60 * 1000) {
        pairingRequests.delete(requestId);
        return res.json({ success: false, error: 'Pairing request expired' });
    }
    
    // Still waiting for pairing
    return res.json({ 
        success: true, 
        paired: false
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Pairing server started on port ${PORT}`);
});

//=====================//
//     © 2025          //
//=====================// 