//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const { handleCommand } = require('./scs/prefixless');
const config = require('./config.env');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const express = require('express');

const botName = 'GOTEN';

// Set up Express server for health check (needed for Render.com)
const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware to parse JSON
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        service: botName, 
        uptime: Math.floor(process.uptime()),
        connected: sock ? 'yes' : 'no'
    });
});

// Session generation endpoint
app.post('/generate-session', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Validate phone number format
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[+\s-]/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }

        // Generate pairing code
        const pairingCode = await generatePairingCode(phoneNumber);
        
        res.status(200).json({
            success: true,
            pairingCode,
            message: 'Pairing code generated successfully'
        });
    } catch (error) {
        console.error('Session generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate session'
        });
    }
});

// Function to generate pairing code
async function generatePairingCode(phoneNumber) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('temp-auth-state');
        
        const client = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: P({ level: 'silent' }),
            browser: ['Goten Bot', 'Chrome', '1.0.0'],
            mobile: false
        });

        // Register event handlers
        client.ev.on('creds.update', saveCreds);
        
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                reject(new Error('Pairing code generation timed out'));
                client.end();
            }, 60000); // 60 second timeout

            client.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                        ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                        : true;
                    
                    if (shouldReconnect) {
                        reject(new Error('Connection closed unexpectedly'));
                    }
                } else if (connection === 'open') {
                    clearTimeout(timeout);
                    const pairingCode = await client.requestPairingCode(phoneNumber);
                    resolve(pairingCode);
                    client.end();
                }
            });
        });
    } catch (error) {
        console.error('Error generating pairing code:', error);
        throw new Error('Failed to generate pairing code');
    }
}

// Start the express server
app.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});

// Enhanced decryption function with error handling
function decryptSessionId(encryptedSessionId) {
    try {
        const key = 'GOTEN_BOT_2025';
        const decoded = Buffer.from(encryptedSessionId, 'base64').toString();
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            decrypted += String.fromCharCode(charCode);
        }
        return decrypted;
    } catch (error) {
        console.error('Session decryption failed:', error);
        throw new Error('Invalid session ID format');
    }
}

// Session management
function ensureSessionDirectory() {
    const sessionsDir = path.join(__dirname, 'sessions');
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
    }
}

// Get session ID from environment variable and decrypt it
const encryptedSessionId = process.env.SESSION_ID;
if (!encryptedSessionId) {
    console.error('SESSION_ID environment variable is required');
    process.exit(1);
}

try {
    const sessionId = decryptSessionId(encryptedSessionId);
    const sessionPath = path.join(__dirname, 'sessions', sessionId);
    ensureSessionDirectory();
} catch (error) {
    console.error('Failed to initialize session:', error);
    process.exit(1);
}

let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: P({ level: 'silent' }),
            browser: ['Goten Bot', 'Safari', '1.0.0'],
            pairingCode: process.env.PAIRING_CODE || undefined,
            connectTimeoutMs: 60000,
            retryRequestDelayMs: 2000
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('QR Code:', qr);
                reconnectAttempts = 0; // Reset on new QR
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                    : true;
                
                console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
                
                if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    setTimeout(connectToWhatsApp, 5000 * reconnectAttempts); // Exponential backoff
                } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    console.error('Max reconnection attempts reached. Please check your connection and restart the bot.');
                    process.exit(1);
                }
            } else if (connection === 'open') {
                console.log('Goten Bot is now connected!');
                reconnectAttempts = 0; // Reset on successful connection
                const sessionId = state.creds.me?.id;
                if (sessionId) {
                    console.log('Session ID:', sessionId);
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            const m = messages[0];
            if (!m.message) return;
            
            try {
                await handleMessage(m, sock);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });

        // Handle errors
        sock.ev.on('connection.update', (update) => {
            if (update.error) {
                console.error('Connection error:', update.error);
            }
        });

    } catch (error) {
        console.error('Failed to connect:', error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connectToWhatsApp, 5000 * reconnectAttempts);
        } else {
            process.exit(1);
        }
    }
}

async function handleMessage(message, sock) {
    try {
        // Skip if message is from the bot itself
        if (message.key.fromMe) return;

        // Add message validation
        if (!message.key.remoteJid || !message.message) {
            console.warn('Invalid message format received');
            return;
        }

        const options = {
            repondre: async (text) => {
                try {
                    await sock.sendMessage(message.key.remoteJid, { text }, { quoted: message });
                } catch (error) {
                    console.error('Failed to send message:', error);
                }
            }
        };

        // Handle the message with prefixless handler
        await handleCommand(message, sock, options);

    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    if (sock) {
        await sock.logout();
    }
    process.exit(0);
});

// Start the bot
connectToWhatsApp().catch(err => {
    console.error('Fatal error in main:', err);
    process.exit(1);
});

// Export the message handler
module.exports = {
    handleMessage
};
