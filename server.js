const express = require('express');
const { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Store active sessions
const activeSessions = new Map();

// Function to ensure session directory exists
async function ensureSessionDirectory() {
    const sessionDir = path.join(__dirname, 'goten_session');
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
            if (now - stats.mtimeMs > 3600000) { // 1 hour
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

// Route to generate session
app.post('/generate-session', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }

        const sessionDir = await ensureSessionDirectory();
        await cleanupOldSessions(sessionDir);

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: ["GOTEN Bot", "Chrome", "1.0.0"],
            logger: pino({ level: 'silent' }),
            mobile: false
        });

        const sessionId = Date.now().toString();
        activeSessions.set(sessionId, { sock, state, saveCreds });

        // Request pairing code
        const pairingCode = await sock.requestPairingCode(phoneNumber);
        
        res.json({ 
            success: true, 
            sessionId,
            pairingCode 
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('Session logged out');
                    activeSessions.delete(sessionId);
                }
            } else if (connection === 'open') {
                const sessionData = activeSessions.get(sessionId);
                if (sessionData) {
                    const sessionId = state.creds.me?.id;
                    if (sessionId) {
                        // Save session data
                        const sessionFile = path.join(sessionDir, 'creds.json');
                        fs.writeFileSync(sessionFile, JSON.stringify(state.creds, null, 2));
                        fs.writeFileSync('session_id.txt', sessionId);
                        
                        // Send session ID via WhatsApp
                        await sock.sendMessage(phoneNumber, { 
                            text: `Your GOTEN Bot Session ID: ${sessionId}\n\nSave this ID for future use.` 
                        });
                        
                        // Clean up
                        activeSessions.delete(sessionId);
                    }
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (error) {
        console.error('Error generating session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to check session status
app.post('/check-session-status', (req, res) => {
    const { sessionId } = req.body;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
        return res.json({ success: false, error: 'Session not found' });
    }
    
    res.json({ 
        success: true, 
        connected: session.sock.user?.id !== undefined 
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 