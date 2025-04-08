const { translate } = require('@vitalets/google-translate-api');

async function execute(message, zk, options) {
    const { repondre, arg } = options;
    
    if (!arg || arg.length < 3) {
        return repondre('Please provide input language, output language, and text to translate.\nExample: translate en sw Hello');
    }
    
    const [fromLang, toLang, ...textParts] = arg;
    const text = textParts.join(' ');
    
    try {
        const result = await translate(text, {
            from: fromLang,
            to: toLang
        });
        
        const response = `*Translation Result:*\n\n` +
                        `From: *${fromLang.toUpperCase()}*\n` +
                        `To: *${toLang.toUpperCase()}*\n\n` +
                        `Original: ${text}\n` +
                        `Translated: ${result.text}`;
        
        repondre(response);
    } catch (error) {
        console.error('Translation error:', error);
        repondre('Error translating text. Please check language codes and try again.');
    }
}

module.exports = {
    nomCom: 'translate',
    execute
}; 