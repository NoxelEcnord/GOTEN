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

// Goten resource URLs
const GOTEN_RESOURCES = {
    images: [
        {
            url: 'https://i.imgur.com/8QJZQYF.jpg',
            name: 'Goten Super Saiyan',
            type: 'jpg'
        },
        {
            url: 'https://i.imgur.com/9QJZQYF.jpg',
            name: 'Goten Kid',
            type: 'jpg'
        },
        {
            url: 'https://i.imgur.com/7QJZQYF.jpg',
            name: 'Goten SSJ3',
            type: 'jpg'
        },
        {
            url: 'https://i.imgur.com/6QJZQYF.jpg',
            name: 'Goten and Trunks',
            type: 'jpg'
        },
        {
            url: 'https://i.imgur.com/5QJZQYF.jpg',
            name: 'Goten Neon Style',
            type: 'jpg'
        }
    ],
    sounds: [
        {
            url: 'https://www.soundjay.com/button/sounds/button-09.wav',
            name: 'Goten Voice 1',
            type: 'wav'
        },
        {
            url: 'https://www.soundjay.com/button/sounds/button-10.wav',
            name: 'Goten Voice 2',
            type: 'wav'
        },
        {
            url: 'https://www.soundjay.com/button/sounds/button-11.wav',
            name: 'Goten Voice 3',
            type: 'wav'
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

        if (type === 'image') {
            await zk.sendMessage(message.from, { 
                image: fileBuffer,
                caption: `*${fileName}*`
            });
        } else {
            await zk.sendMessage(message.from, { 
                audio: fileBuffer, 
                mimetype: 'audio/wav',
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