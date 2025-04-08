const { encryptKey, decryptKey, obfuscateKey, deobfuscateKey } = require('./encryption');
require('dotenv').config();

class ConfigManager {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        // API Keys
        this.config.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        this.config.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        this.config.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        this.config.DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;

        // WhatsApp Configuration
        this.config.SESSION_ID = process.env.SESSION_ID;
        this.config.SESSION_KEY = process.env.SESSION_KEY;

        // Database Configuration
        this.config.MONGODB_URI = process.env.MONGODB_URI;
        this.config.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

        // Server Configuration
        this.config.PORT = process.env.PORT || 3000;
        this.config.NODE_ENV = process.env.NODE_ENV || 'development';

        // Security
        this.config.JWT_SECRET = process.env.JWT_SECRET;
        this.config.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

        // External Services
        this.config.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
        this.config.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
        this.config.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
    }

    get(key) {
        const value = this.config[key];
        if (!value) return null;

        // For API keys, decrypt and deobfuscate
        if (key.endsWith('_API_KEY') || key === 'SESSION_KEY' || key === 'JWT_SECRET' || key === 'ENCRYPTION_KEY') {
            const decrypted = decryptKey(value);
            return deobfuscateKey(decrypted);
        }

        return value;
    }

    set(key, value) {
        if (key.endsWith('_API_KEY') || key === 'SESSION_KEY' || key === 'JWT_SECRET' || key === 'ENCRYPTION_KEY') {
            const obfuscated = obfuscateKey(value);
            this.config[key] = encryptKey(obfuscated);
        } else {
            this.config[key] = value;
        }
    }

    getAll() {
        const result = {};
        for (const key in this.config) {
            result[key] = this.get(key);
        }
        return result;
    }
}

module.exports = new ConfigManager(); 