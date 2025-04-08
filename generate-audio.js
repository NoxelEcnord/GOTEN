const fs = require('fs');
const path = require('path');
const https = require('https');
const googleTTS = require('google-tts-api');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'public', 'assets', 'audio');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Define audio scripts for Goten bot
const audioScripts = [
    { 
        filename: 'welcome.mp3',
        text: "Hello! I'm Goten Bot, your friendly WhatsApp assistant. How may I help you today?"
    },
    { 
        filename: 'goodmorning.mp3',
        text: "Good morning! This is Goten Bot. I hope you have a wonderful day ahead. Let me know if you need any assistance."
    },
    { 
        filename: 'goodafternoon.mp3',
        text: "Good afternoon! Goten Bot at your service. Feel free to ask me anything or check out my commands with the menu option."
    },
    { 
        filename: 'goodnight.mp3',
        text: "Good night! Goten Bot wishes you sweet dreams. I'll be here tomorrow whenever you need me."
    },
    { 
        filename: 'help.mp3',
        text: "Need help? I'm Goten Bot, your digital assistant. Type 'menu' to see all available commands, or ask me directly what you need."
    },
    { 
        filename: 'thanks.mp3',
        text: "Thank you for using Goten Bot! Your feedback helps me improve. Is there anything else I can help you with?"
    },
    { 
        filename: 'sorry.mp3',
        text: "I apologize for the inconvenience. As Goten Bot, I'm continuously learning. Please let me know how I can serve you better."
    },
    { 
        filename: 'joke.mp3',
        text: "Why don't scientists trust atoms? Because they make up everything! Haha! Goten Bot loves a good joke!"
    },
    { 
        filename: 'shengmode.mp3',
        text: "Sheng mode activated! Goten Bot is now using Kenyan slang. Sasa! How can I help you today?"
    },
    { 
        filename: 'aimode.mp3',
        text: "AI mode enabled. Goten Bot is now using advanced artificial intelligence to answer your queries. How may I assist you?"
    },
    {
        filename: 'introduction.mp3',
        text: "Welcome to Goten Bot! Named after the powerful character from Dragon Ball Z, I'm your ultimate WhatsApp assistant designed to make your messaging experience more fun and productive. My features include AI chat powered by OpenAI and Google Gemini, media downloads from platforms like YouTube and TikTok, interactive games, utility tools, and group management. I even have a special Kenyan Sheng mode for localized conversations! To get started, you'll need to generate a session ID from this website and deploy me using the instructions provided. I'm constantly improving thanks to my developer NoxelEcnord. If you enjoy using me, please consider starring the GitHub repository. Now, let's power up your WhatsApp experience together!",
        isLong: true
    }
];

// Function to download file from URL
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
                console.log(`Downloaded ${destination}`);
            });
        }).on('error', err => {
            fs.unlink(destination, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

// Function to merge audio chunks
async function mergeAudioChunks(urls, outputFile) {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    try {
        // Download all chunks
        const chunkFiles = [];
        for (let i = 0; i < urls.length; i++) {
            const chunkFile = path.join(tempDir, `chunk_${i}.mp3`);
            await downloadFile(urls[i], chunkFile);
            chunkFiles.push(chunkFile);
        }
        
        // Concatenate all chunks using Node.js streams
        const writeStream = fs.createWriteStream(outputFile);
        
        for (let i = 0; i < chunkFiles.length; i++) {
            const chunkContent = fs.readFileSync(chunkFiles[i]);
            writeStream.write(chunkContent);
        }
        
        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                // Clean up temp files
                chunkFiles.forEach(file => fs.unlinkSync(file));
                resolve();
            });
            writeStream.on('error', reject);
        });
    } catch (error) {
        throw error;
    }
}

// Generate audio files sequentially
async function generateAudioFiles() {
    console.log('Starting TTS generation for Goten Bot audio files...');
    
    for (let i = 0; i < audioScripts.length; i++) {
        const script = audioScripts[i];
        const outputFile = path.join(outputDir, script.filename);
        
        console.log(`Generating ${script.filename}...`);
        
        try {
            if (script.isLong) {
                // Handle long text with getAllAudioUrls
                const urls = await googleTTS.getAllAudioUrls(script.text, {
                    lang: 'en',
                    slow: false,
                    host: 'https://translate.google.com',
                });
                
                // Merge all audio chunks
                await mergeAudioChunks(urls.map(item => item.url), outputFile);
                console.log(`Successfully generated ${script.filename} (long text)`);
            } else {
                // Regular short text handling
                const url = googleTTS.getAudioUrl(script.text, {
                    lang: 'en',
                    slow: false,
                    host: 'https://translate.google.com',
                });
                
                // Download the audio file
                await downloadFile(url, outputFile);
                console.log(`Successfully generated ${script.filename}`);
            }
        } catch (error) {
            console.error(`Error generating ${script.filename}:`, error);
        }
    }
    
    console.log('All Goten Bot audio files generated successfully!');
}

// Execute the generator
generateAudioFiles().catch(error => {
    console.error('Error in audio generation:', error);
}); 