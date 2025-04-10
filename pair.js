const { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

console.log('Starting WhatsApp session generation...');

// Function to ensure session directory exists
async function ensureSessionDirectory() {
    const sessionDir = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
}

// Function to clean up old session files
async function cleanupOldSessions(sessionDir) {
    try {
        const files = fs.readdirSync(sessionDir);
        const now = Date.now();
        for (const file of files) {
            const filePath = path.join(sessionDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > 3600000) {
                if (stats.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning up sessions:', error);
    }
}

// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Generate session ID
async function generateSession(phoneNumber) {
    try {
        console.log('Initializing session for phone number:', phoneNumber);
        const sessionDir = await ensureSessionDirectory();
        await cleanupOldSessions(sessionDir);
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
        console.log('Auth state initialized');

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: state,
            browser: ["Chrome (Linux)", "Chrome", "106.0.5249.126"],
            logger: pino({ level: 'silent' }),
            mobile: false
        });
        console.log('Socket created');

        // Wait for socket to be ready
        await delay(5000);

        // Request pairing code
        try {
            console.log('Requesting pairing code...');
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            const pairingCode = await sock.requestPairingCode(cleanPhone);
            console.log('Your WhatsApp pairing code:', pairingCode);
        } catch (error) {
            console.error('Error requesting pairing code:', error);
            throw error;
        }

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 60000);

            sock.ev.on('connection.update', async (update) => {
                console.log('Connection update:', JSON.stringify(update, null, 2));
                const { connection, lastDisconnect } = update;
                
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    console.log('Connection closed, status code:', statusCode);
                    
                    if (statusCode === DisconnectReason.loggedOut) {
                        console.log('Session logged out, please try again');
                        reject(new Error('Session logged out'));
                        return;
                    }
                    
                    if (statusCode === 405) {
                        console.log('Method not allowed. Please check your internet connection and try again.');
                        reject(new Error('Method not allowed'));
                        return;
                    }
                    
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
                        statusCode !== 403;
                    
                    if (shouldReconnect) {
                        console.log('Attempting to reconnect...');
                        await generateSession(phoneNumber);
                    } else {
                        reject(new Error('Connection closed'));
                    }
                } else if (connection === 'open') {
                    console.log('Connection established');
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        // Get the session ID
        const sessionId = state.creds.me?.id;
        if (sessionId) {
            console.log('Session ID:', sessionId);
            
            // Save session ID to file
            const sessionFile = path.join(sessionDir, 'creds.json');
            fs.writeFileSync(sessionFile, JSON.stringify(state.creds, null, 2));
            console.log('Session saved to:', sessionFile);
        } else {
            throw new Error('Failed to get session ID');
        }

        sock.ev.on('creds.update', saveCreds);
        return sock;
    } catch (error) {
        console.error('Error in generateSession:', error);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        throw error;
    }
}

// Start the session generation process
const phoneNumber = process.argv[2] || '254726498682';
console.log('Starting with phone number:', phoneNumber);
generateSession(phoneNumber).catch(console.error);