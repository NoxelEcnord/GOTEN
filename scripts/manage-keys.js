const fs = require('fs');
const path = require('path');
const { encryptKey, decryptKey, obfuscateKey, deobfuscateKey } = require('../utils/encryption');

// Function to update .env file with encrypted keys
function updateEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Encrypt and obfuscate API keys
    const keysToEncrypt = [
        'OPENAI_API_KEY',
        'GEMINI_API_KEY',
        'DEEPAI_API_KEY',
        'ELEVENLABS_API_KEY',
        'SESSION_KEY',
        'JWT_SECRET',
        'ENCRYPTION_KEY'
    ];

    keysToEncrypt.forEach(key => {
        const regex = new RegExp(`${key}=([^\n]+)`);
        const match = envContent.match(regex);
        if (match && match[1]) {
            const originalKey = match[1].trim().replace(/["']/g, '');
            const encryptedKey = encryptKey(obfuscateKey(originalKey));
            envContent = envContent.replace(regex, `${key}=${encryptedKey}`);
        }
    });

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with encrypted keys');
}

// Function to decrypt and verify keys
function verifyKeys() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    const keysToVerify = [
        'OPENAI_API_KEY',
        'GEMINI_API_KEY'
    ];

    keysToVerify.forEach(key => {
        const regex = new RegExp(`${key}=([^\n]+)`);
        const match = envContent.match(regex);
        if (match && match[1]) {
            const encryptedKey = match[1].trim().replace(/["']/g, '');
            const decryptedKey = deobfuscateKey(decryptKey(encryptedKey));
            console.log(`🔑 ${key}: ${decryptedKey.substring(0, 10)}...`);
        }
    });
}

// Main execution
if (require.main === module) {
    console.log('🔐 Starting key management...');
    updateEnvFile();
    verifyKeys();
    console.log('✅ Key management completed');
} 