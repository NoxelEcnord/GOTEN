const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config.env');

// Initialize AI clients with error handling
let openai = null;
let genAI = null;

try {
    if (config.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: config.OPENAI_API_KEY
        });
    }
} catch (error) {
    console.error('Error initializing OpenAI:', error);
}

try {
    if (config.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    }
} catch (error) {
    console.error('Error initializing Gemini:', error);
}

// Rate limiting map
const userRequests = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in milliseconds

// Message history map
const messageHistory = new Map();
const MAX_HISTORY = 5;

function isRateLimited(userId) {
    const now = Date.now();
    const userHistory = userRequests.get(userId) || [];
    
    // Clean up old requests
    const recentRequests = userHistory.filter(time => now - time < RATE_WINDOW);
    userRequests.set(userId, recentRequests);
    
    return recentRequests.length >= RATE_LIMIT;
}

function formatResponse(text, provider) {
    return `🤖 *AI Response* (via ${provider})\n\n${text}\n\n_Powered by Goten Bot_`;
}

function addToHistory(userId, message) {
    const history = messageHistory.get(userId) || [];
    history.push(message);
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
    messageHistory.set(userId, history);
}

function getHistoryContext(userId) {
    const history = messageHistory.get(userId) || [];
    return history.map(msg => `User: ${msg}`).join('\n');
}

async function handleAIRequest(prompt, userId = 'default') {
    try {
        // Check rate limit
        if (isRateLimited(userId)) {
            return {
                success: false,
                error: 'Rate limit exceeded. Please wait a minute before trying again.'
            };
        }

        // Add request to history
        const userHistory = userRequests.get(userId) || [];
        userHistory.push(Date.now());
        userRequests.set(userId, userHistory);

        // Add message to history
        addToHistory(userId, prompt);

        // Get context from history
        const context = getHistoryContext(userId);

        // Try OpenAI first if available
        if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are a helpful AI assistant. Use the conversation history to provide context-aware responses." },
                        { role: "user", content: `Previous conversation:\n${context}\n\nCurrent message: ${prompt}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                });

                return {
                    success: true,
                    response: formatResponse(completion.choices[0].message.content, 'OpenAI'),
                    provider: 'OpenAI'
                };
            } catch (error) {
                console.error('OpenAI error:', error);
                // Fall through to Gemini
            }
        }
        
        // Try Gemini if available
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await model.generateContent(`Previous conversation:\n${context}\n\nCurrent message: ${prompt}`);
                const response = await result.response;
                
                return {
                    success: true,
                    response: formatResponse(response.text(), 'Gemini'),
                    provider: 'Gemini'
                };
            } catch (error) {
                console.error('Gemini error:', error);
            }
        }

        // If we get here, both services failed or are unavailable
        return {
            success: false,
            error: 'AI services are currently unavailable. Please try again later.'
        };
    } catch (error) {
        console.error('AI handler error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred while processing your request.'
        };
    }
}

module.exports = {
    handleAIRequest
}; 