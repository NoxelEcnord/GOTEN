const crypto = require('crypto');

// Salt-based encryption/decryption
const SALT = 'GOTEN_BOT_2024_SAFE';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encryptKey(key) {
    if (!key) return '';
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SALT.padEnd(32)), iv);
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Error encrypting key:', error);
        return '';
    }
}

function decryptKey(encryptedKey) {
    if (!encryptedKey) return '';
    try {
        const [ivHex, encrypted] = encryptedKey.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SALT.padEnd(32)), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Error decrypting key:', error);
        return '';
    }
}

// Character substitution for additional security
const SUBSTITUTION_MAP = {
    'Y': '*',
    'y': '.',
    'A': '@',
    'a': '#',
    'E': '&',
    'e': '^',
    'I': '!',
    'i': '~',
    'O': '$',
    'o': '%',
    'U': '?',
    'u': '+'
};

function obfuscateKey(key) {
    if (!key) return '';
    return key.split('').map(char => SUBSTITUTION_MAP[char] || char).join('');
}

function deobfuscateKey(obfuscatedKey) {
    if (!obfuscatedKey) return '';
    const reverseMap = Object.entries(SUBSTITUTION_MAP).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, {});
    return obfuscatedKey.split('').map(char => reverseMap[char] || char).join('');
}

module.exports = {
    encryptKey,
    decryptKey,
    obfuscateKey,
    deobfuscateKey
}; 