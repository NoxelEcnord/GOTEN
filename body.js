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

const botName = 'GOTEN';

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
