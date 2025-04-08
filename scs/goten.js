const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const GOTEN_DIR = path.join(__dirname, '../goten');
const IMAGES_DIR = path.join(GOTEN_DIR, 'images');
const SOUNDS_DIR = path.join(GOTEN_DIR, 'sounds');

// Create directories if they don't exist
if (!fs.existsSync(GOTEN_DIR)) fs.mkdirSync(GOTEN_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
if (!fs.existsSync(SOUNDS_DIR)) fs.mkdirSync(SOUNDS_DIR);

// Get base URL from Render.com static site
const STATIC_BASE_URL = 'https://goten-bot.onrender.com';

// Goten resource URLs
const GOTEN_RESOURCES = {
    images: [
        `${STATIC_BASE_URL}/goten/images/goten_standing.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_happy_jumping.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_happy_blushing_pause.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_flying_happy.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_arms_up.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_neon.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_adult_light.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_and_trunks_ssj1_back_on_back_cheers.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_x_trunks_ssj1_playing.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_ssj1_bruised_sad.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_wasted_ssj3_angry_bruised.jpg`,
        `${STATIC_BASE_URL}/goten/images/goten_ss_god_red_holding spirit bomb_looking curius.jpg`
    ],
    sounds: [
        `${STATIC_BASE_URL}/goten/sounds/welcome.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/goodmorning.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/goodafternoon.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/goodnight.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/help.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/thanks.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/sorry.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/joke.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/shengmode.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/aimode.mp3`,
        `${STATIC_BASE_URL}/goten/sounds/introduction.mp3`
    ]
};

async function downloadGotenResources(message, zk) {
    try {
        let downloadedCount = 0;
        const totalResources = GOTEN_RESOURCES.images.length + GOTEN_RESOURCES.sounds.length;

        // Download images
        for (const image of GOTEN_RESOURCES.images) {
            try {
                const response = await axios.get(image, { responseType: 'arraybuffer' });
                const fileName = image.split('/').pop().replace(/\s+/g, '_');
                fs.writeFileSync(path.join(IMAGES_DIR, fileName), response.data);
                downloadedCount++;
                await zk.sendMessage(message.from, { 
                    text: `✅ Downloaded: ${fileName} (${downloadedCount}/${totalResources})` 
                });
            } catch (error) {
                console.error(`Error downloading ${fileName}:`, error);
                await zk.sendMessage(message.from, { 
                    text: `❌ Failed to download: ${fileName}` 
                });
            }
        }

        // Download sounds
        for (const sound of GOTEN_RESOURCES.sounds) {
            try {
                const response = await axios.get(sound, { responseType: 'arraybuffer' });
                const fileName = sound.split('/').pop().replace(/\s+/g, '_');
                fs.writeFileSync(path.join(SOUNDS_DIR, fileName), response.data);
                downloadedCount++;
                await zk.sendMessage(message.from, { 
                    text: `✅ Downloaded: ${fileName} (${downloadedCount}/${totalResources})` 
                });
            } catch (error) {
                console.error(`Error downloading ${fileName}:`, error);
                await zk.sendMessage(message.from, { 
                    text: `❌ Failed to download: ${fileName}` 
                });
            }
        }

        await zk.sendMessage(message.from, { 
            text: `✨ Download Complete!\nSuccessfully downloaded ${downloadedCount} out of ${totalResources} resources.` 
        });
    } catch (error) {
        console.error('Error in download process:', error);
        await zk.sendMessage(message.from, { 
            text: '❌ Error during download process. Please try again later.' 
        });
    }
}

async function listGotenResources(message, zk) {
    try {
        const images = fs.readdirSync(IMAGES_DIR);
        const sounds = fs.readdirSync(SOUNDS_DIR);

        let response = '*🎨 Goten Images:*\n';
        images.forEach((file, index) => {
            const name = file.split('.')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            response += `${index + 1}. ${name}\n`;
        });

        response += '\n*🎵 Goten Sounds:*\n';
        sounds.forEach((file, index) => {
            const name = file.split('.')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            response += `${index + 1}. ${name}\n`;
        });

        response += '\nUse `goten send image/sound <number>` to send a resource.';
        await zk.sendMessage(message.from, { text: response });
    } catch (error) {
        console.error('Error listing Goten resources:', error);
        await zk.sendMessage(message.from, { 
            text: '❌ Error listing resources. Please try again later.' 
        });
    }
}

async function sendGotenResource(zk, message, type, index) {
    try {
        let dir, files, caption;
        
        if (type === 'image') {
            dir = IMAGES_DIR;
            files = fs.readdirSync(dir).filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));
            caption = `📸 Goten Image ${index}/${files.length}`;
        } else if (type === 'sound') {
            dir = SOUNDS_DIR;
            files = fs.readdirSync(dir).filter(file => file.endsWith('.mp3') || file.endsWith('.wav'));
            caption = `🔊 Goten Sound ${index}/${files.length}`;
        } else {
            throw new Error('Invalid resource type. Use "image" or "sound"');
        }
        
        if (index < 1 || index > files.length) {
            throw new Error(`Invalid index. Should be between 1 and ${files.length}`);
        }
        
        const filePath = path.join(dir, files[index - 1]);
        const fileData = fs.readFileSync(filePath);
        
        if (type === 'image') {
            await zk.sendMessage(message.from, { 
                image: fileData,
                caption: caption
            });
        } else { // sound
            const fileExt = files[index - 1].split('.').pop().toLowerCase();
            const mimetype = fileExt === 'mp3' ? 'audio/mp3' : 'audio/wav';
            
            await zk.sendMessage(message.from, { 
                audio: fileData, 
                mimetype: mimetype,
                ptt: true // play as voice note
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error sending Goten resource:', error);
        throw error;
    }
}

async function execute(message, zk, options) {
    const args = message.body.split(' ').slice(1);
    const command = args[0];

    switch (command) {
        case 'download':
            await downloadGotenResources(message, zk);
            break;
        case 'list':
            await listGotenResources(message, zk);
            break;
        case 'send':
            await sendGotenResource(zk, message, args[1], parseInt(args[2]));
            break;
        default:
            await zk.sendMessage(message.from, {
                text: '*🎭 Goten Resource Manager*\n\n' +
                      'Commands:\n' +
                      '• goten download - Download all Goten resources\n' +
                      '• goten list - List available resources\n' +
                      '• goten send image/sound <number> - Send a specific resource\n\n' +
                      'Example: goten send image 1'
            });
    }
}

module.exports = {
    name: 'goten',
    execute
}; 