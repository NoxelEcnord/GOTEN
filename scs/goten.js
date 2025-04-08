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
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_standing.jpg`,
            name: 'Goten Standing',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_happy_jumping.jpg`,
            name: 'Goten Happy Jumping',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_flying_happy.jpg`,
            name: 'Goten Flying Happy',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_arms_up.jpg`,
            name: 'Goten Arms Up',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_neon.jpg`,
            name: 'Goten Neon Style',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_happy_blushing_pause.jpg`,
            name: 'Goten Blushing',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_ssj1_bruised_sad.jpg`,
            name: 'Goten SSJ1 Sad',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_and_trunks_ssj1_back_on_back_cheers.jpg`,
            name: 'Goten and Trunks Cheers',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_wasted_ssj3_angry_bruised.jpg`,
            name: 'Goten SSJ3 Angry',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_ss_god_red_holding spirit bomb_looking curius.jpg`,
            name: 'Goten SS God',
            type: 'jpg'
        },
        {
            url: `${STATIC_BASE_URL}/assets/images/goten_x_trunks_ssj1_playing.jpg`,
            name: 'Goten and Trunks Playing',
            type: 'jpg'
        }
    ],
    sounds: [
        {
            url: `${STATIC_BASE_URL}/assets/sounds/welcome.mp3`,
            name: 'Goten Welcome',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/goodmorning.mp3`,
            name: 'Goten Good Morning',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/goodafternoon.mp3`,
            name: 'Goten Good Afternoon',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/goodnight.mp3`,
            name: 'Goten Good Night',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/help.mp3`,
            name: 'Goten Help',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/thanks.mp3`,
            name: 'Goten Thanks',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/sorry.mp3`,
            name: 'Goten Sorry',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/joke.mp3`,
            name: 'Goten Joke',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/shengmode.mp3`,
            name: 'Goten Sheng Mode',
            type: 'mp3'
        },
        {
            url: `${STATIC_BASE_URL}/assets/sounds/aimode.mp3`,
            name: 'Goten AI Mode',
            type: 'mp3'
        }
    ]
};

async function downloadGotenResources(message, zk) {
    try {
        let downloadedCount = 0;
        const totalResources = GOTEN_RESOURCES.images.length + GOTEN_RESOURCES.sounds.length;

        // Download images
        for (const image of GOTEN_RESOURCES.images) {
            try {
                const response = await axios.get(image.url, { responseType: 'arraybuffer' });
                const fileName = `${image.name.toLowerCase().replace(/\s+/g, '_')}.${image.type}`;
                fs.writeFileSync(path.join(IMAGES_DIR, fileName), response.data);
                downloadedCount++;
                await zk.sendMessage(message.from, { 
                    text: `✅ Downloaded: ${image.name} (${downloadedCount}/${totalResources})` 
                });
            } catch (error) {
                console.error(`Error downloading ${image.name}:`, error);
                await zk.sendMessage(message.from, { 
                    text: `❌ Failed to download: ${image.name}` 
                });
            }
        }

        // Download sounds
        for (const sound of GOTEN_RESOURCES.sounds) {
            try {
                const response = await axios.get(sound.url, { responseType: 'arraybuffer' });
                const fileName = `${sound.name.toLowerCase().replace(/\s+/g, '_')}.${sound.type}`;
                fs.writeFileSync(path.join(SOUNDS_DIR, fileName), response.data);
                downloadedCount++;
                await zk.sendMessage(message.from, { 
                    text: `✅ Downloaded: ${sound.name} (${downloadedCount}/${totalResources})` 
                });
            } catch (error) {
                console.error(`Error downloading ${sound.name}:`, error);
                await zk.sendMessage(message.from, { 
                    text: `❌ Failed to download: ${sound.name}` 
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

async function sendGotenResource(message, zk, args) {
    try {
        const [type, index] = args;
        const dir = type === 'image' ? IMAGES_DIR : SOUNDS_DIR;
        const files = fs.readdirSync(dir);
        
        if (index > files.length || index < 1) {
            await zk.sendMessage(message.from, { 
                text: '❌ Invalid resource index. Use `goten list` to see available resources.' 
            });
            return;
        }

        const filePath = path.join(dir, files[index - 1]);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = files[index - 1].split('.')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const fileExt = files[index - 1].split('.').pop().toLowerCase();

        if (type === 'image') {
            await zk.sendMessage(message.from, { 
                image: fileBuffer,
                caption: `*${fileName}*`
            });
        } else {
            // Determine correct mimetype based on file extension
            const mimetype = fileExt === 'mp3' ? 'audio/mp3' : 'audio/wav';
            
            await zk.sendMessage(message.from, { 
                audio: fileBuffer, 
                mimetype: mimetype,
                caption: `*${fileName}*`
            });
        }
    } catch (error) {
        console.error('Error sending Goten resource:', error);
        await zk.sendMessage(message.from, { 
            text: '❌ Error sending resource. Please try again later.' 
        });
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
            await sendGotenResource(message, zk, args.slice(1));
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