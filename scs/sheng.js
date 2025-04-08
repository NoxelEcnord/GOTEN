const config = require('../config.env');
const { handleAIRequest } = require('./ai');

// Store Sheng mode status per chat
const shengMode = new Map();

// Common Sheng words and phrases (2024)
const shengDictionary = {
    // Greetings and responses
    "hello": "niaje",
    "hi": "sasa",
    "how are you": "uko aje",
    "good": "poa",
    "bad": "mbaya",
    "yes": "ndio",
    "no": "hapana",
    "what's up": "vipi",
    "thanks": "asante",
    "welcome": "karibu",
    "bye": "tutaonana",
    
    // Time expressions
    "now": "sasa hivi",
    "today": "leo",
    "tomorrow": "kesho",
    "yesterday": "jana",
    "later": "baadaye",
    "wait": "ngoja",
    
    // Common words
    "money": "mshwari",
    "food": "chakula",
    "car": "gari",
    "house": "keja",
    "friend": "msee",
    "person": "mtu",
    "cool": "poa",
    "nice": "fiti",
    "problem": "noma",
    "work": "kazi",
    "school": "shule",
    "phone": "simu",
    
    // Modern slang (2024)
    "awesome": "poa sana",
    "perfect": "fiti kabisa",
    "true": "kweli",
    "fake": "fake",
    "relax": "ishi poa",
    "understand": "catch",
    "story": "mbogi",
    "friend": "broski",
    "bro": "buda",
    "sister": "siz",
    "police": "mabro",
    "expensive": "bei kali",
    "cheap": "bei poa",
    
    // Tech terms
    "internet": "net",
    "message": "msg",
    "whatsapp": "wa",
    "facebook": "fb",
    "instagram": "insta",
    "phone": "foni",
    "computer": "compu",
    
    // Emotions
    "happy": "furahi",
    "sad": "stress",
    "angry": "kasheshe",
    "love": "penda",
    "hate": "chuki"
};

// Rate limiting for Sheng mode
const shengRequests = new Map();
const SHENG_RATE_LIMIT = 20; // requests per minute
const SHENG_RATE_WINDOW = 60000; // 1 minute in milliseconds

function isRateLimited(chatId) {
    const now = Date.now();
    const history = shengRequests.get(chatId) || [];
    
    // Clean up old requests
    const recentRequests = history.filter(time => now - time < SHENG_RATE_WINDOW);
    shengRequests.set(chatId, recentRequests);
    
    return recentRequests.length >= SHENG_RATE_LIMIT;
}

function isShengModeEnabled(chatId) {
    return shengMode.get(chatId) || false;
}

function toggleShengMode(chatId, enable) {
    shengMode.set(chatId, enable);
    return enable;
}

async function generateShengResponse(message, zk, options) {
    const { repondre } = options;
    const chatId = message.key.remoteJid;
    
    if (!isShengModeEnabled(chatId)) {
        return false;
    }

    try {
        // Check rate limit
        if (isRateLimited(chatId)) {
            await repondre('❌ Pole! You are sending too many messages. Please wait a minute.');
            return true;
        }

        // Add request to history
        const history = shengRequests.get(chatId) || [];
        history.push(Date.now());
        shengRequests.set(chatId, history);

        // Get last 5 messages for context
        const messages = await zk.loadMessages(chatId, { limit: 5 });
        const context = messages
            .filter(msg => msg.body)
            .map(msg => msg.body)
            .join('\n');

        // Create prompt for AI with Sheng context
        const prompt = `You are a Kenyan youth from 2024 who speaks Sheng fluently. 
Use current Sheng slang and keep responses brief, casual, and on point.
Mix Sheng with some English naturally, as Kenyan youth do.
Make it sound authentic and current.

Context from last messages:
${context}

User message: ${message.body}

Respond in modern Sheng (2024):`;

        const response = await handleAIRequest(prompt);
        
        if (response.success) {
            // Replace common words with Sheng
            let shengResponse = response.response;
            for (const [english, sheng] of Object.entries(shengDictionary)) {
                const regex = new RegExp(`\\b${english}\\b`, 'gi');
                shengResponse = shengResponse.replace(regex, sheng);
            }
            
            await repondre(shengResponse);
            return true;
        } else if (response.error) {
            await repondre(`❌ ${response.error}`);
            return true;
        }
    } catch (error) {
        console.error('Sheng response error:', error);
        await repondre('❌ Noma! Something went wrong with Sheng mode.');
        return true;
    }
    
    return false;
}

async function execute(message, zk, options) {
    const { repondre, arg } = options;
    const chatId = message.key.remoteJid;
    
    try {
        if (!arg || arg.length === 0) {
            return await repondre(`
🇰🇪 *Sheng Mode Commands*

.sheng on - Turn on Sheng mode
.sheng off - Turn off Sheng mode
.sheng status - Check current status

_When Sheng mode is on, the bot will respond in Sheng slang!_`);
        }

        switch (arg[0].toLowerCase()) {
            case 'on':
                toggleShengMode(chatId, true);
                return await repondre('🎉 Sheng mode imechemka!\nNow we can vibe in Sheng! 🔥');
            
            case 'off':
                toggleShengMode(chatId, false);
                return await repondre('😢 Sheng mode imeisha!\nBack to normal mode.');
            
            case 'status':
                const status = isShengModeEnabled(chatId) ? 'ON 🔥' : 'OFF 😴';
                return await repondre(`🇰🇪 Sheng mode is currently: ${status}`);
            
            default:
                return await repondre('❌ Use .sheng on/off to toggle Sheng mode');
        }
    } catch (error) {
        console.error('Sheng command error:', error);
        return await repondre('❌ Noma! Something went wrong with the command.');
    }
}

module.exports = {
    nomCom: 'sheng',
    aliases: ['slang', 'kenya'],
    description: 'Toggle Sheng mode for casual Kenyan slang conversations',
    execute,
    generateShengResponse,
    isShengModeEnabled
}; 