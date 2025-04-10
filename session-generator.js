const { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

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
            // Clean up files older than 1 hour
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

// Main session generation function
async function generateSession() {
    try {
        console.log('\n🤖 GOTEN Session Generator');
        console.log('=======================');
        
        const sessionDir = await ensureSessionDirectory();
        console.log('📁 Session directory:', sessionDir);
        
        await cleanupOldSessions(sessionDir);
        console.log('🧹 Cleaned up old sessions');
        
        console.log('🔐 Loading auth state...');
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        console.log('✅ Auth state loaded');
        
        console.log('📱 Fetching WhatsApp version...');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`📱 Using WhatsApp v${version.join('.')} (${isLatest ? 'latest' : 'not latest'})`);
        
        console.log('🔌 Initializing socket connection...');
        const sock = makeWASocket({
            version,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: ["GOTEN Bot", "Chrome", "1.0.0"],
            logger: pino({ level: 'debug' }),
            mobile: false,
            syncFullHistory: true, // Enable full history sync
            markOnlineOnConnect: false, // Don't mark as online to receive notifications
            getMessage: async (key) => {
                // Implement message retrieval for resending missing messages
                return null;
            }
        });
        console.log('✅ Socket initialized');

        // Wait for connection
        console.log('⏳ Waiting for connection...');
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('❌ Connection timeout');
                reject(new Error('Connection timeout after 120 seconds'));
            }, 120000);

            sock.ev.on('connection.update', async (update) => {
                console.log('📡 Connection update:', JSON.stringify(update, null, 2));
                
                const { connection, lastDisconnect, qr, pairingCode } = update;
                
                if (pairingCode) {
                    console.log('\n📱 WhatsApp Pairing Code:');
                    console.log('========================');
                    console.log(pairingCode);
                    console.log('========================');
                    console.log('\n1. Open WhatsApp on your phone');
                    console.log('2. Go to Settings > Linked Devices');
                    console.log('3. Tap "Link a Device"');
                    console.log('4. Enter the code above');
                    console.log('\nWaiting for pairing...');
                }
                
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    console.log('🔒 Connection closed. Status code:', statusCode);
                    
                    if (statusCode === DisconnectReason.loggedOut) {
                        console.log('\n❌ Session logged out');
                        reject(new Error('Session logged out'));
                        return;
                    }
                    
                    if (statusCode === DisconnectReason.restartRequired) {
                        console.log('\n🔄 Restart required, reconnecting...');
                        await generateSession();
                        return;
                    }
                    
                    if (statusCode === 405) {
                        console.log('\n❌ Connection error. Please check your internet connection.');
                        reject(new Error('Connection error'));
                        return;
                    }
                    
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom) && 
                        statusCode !== 403;
                    
                    if (shouldReconnect) {
                        console.log('\n🔄 Reconnecting...');
                        await generateSession();
                    } else {
                        reject(new Error('Connection closed'));
                    }
                } else if (connection === 'open') {
                    console.log('\n✅ Connected successfully!');
                    clearTimeout(timeout);
                    resolve();
                }
            });

            // Handle history sync
            sock.ev.on('messaging-history.set', ({ chats, contacts, messages, syncType }) => {
                console.log(`\n📥 History sync complete (${syncType})`);
                console.log(`📱 Chats: ${chats.length}`);
                console.log(`👥 Contacts: ${contacts.length}`);
                console.log(`💬 Messages: ${messages.length}`);
            });
        });

        // Get and save session data
        const sessionId = state.creds.me?.id;
        if (sessionId) {
            console.log('\n📝 Session ID:', sessionId);
            
            // Save session data
            const sessionFile = path.join(sessionDir, 'creds.json');
            fs.writeFileSync(sessionFile, JSON.stringify(state.creds, null, 2));
            console.log('💾 Session saved to:', sessionFile);
            
            // Save just the ID to a separate file for easy access
            fs.writeFileSync('session_id.txt', sessionId);
            console.log('💾 Session ID saved to: session_id.txt');
        } else {
            throw new Error('Failed to get session ID');
        }

        sock.ev.on('creds.update', saveCreds);
        return sock;
    } catch (error) {
        console.error('\n❌ Error generating session:', error);
        throw error;
    }
}

// Start the session generation
if (require.main === module) {
    console.log('\n🚀 Starting GOTEN Session Generator...');
    generateSession().catch(error => {
        console.error('\n❌ Session generation failed:', error);
        process.exit(1);
    });
}

module.exports = { generateSession }; 