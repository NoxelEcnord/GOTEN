const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { exec } = require('child_process');

const CACHE_DIR = path.join(__dirname, '../cache');
const DP_DIR = path.join(__dirname, '../dp');
const BROADCAST_FILE = path.join(__dirname, '../broadcast.json');

// Create directories if they don't exist
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
if (!fs.existsSync(DP_DIR)) fs.mkdirSync(DP_DIR);

// System settings
const SYSTEM_SETTINGS = {
    autoClearCache: true,
    clearInterval: 6 * 60 * 60 * 1000, // 6 hours
    dpChangeInterval: 60 * 1000, // 1 minute
    lastClearTime: Date.now(),
    lastDpChangeTime: Date.now(),
    dpImages: [],
    currentDpIndex: 0
};

// Load settings
try {
    const settingsFile = path.join(__dirname, '../system_settings.json');
    if (fs.existsSync(settingsFile)) {
        Object.assign(SYSTEM_SETTINGS, JSON.parse(fs.readFileSync(settingsFile)));
    }
} catch (error) {
    console.error('Error loading system settings:', error);
}

// Save settings
function saveSettings() {
    try {
        const settingsFile = path.join(__dirname, '../system_settings.json');
        fs.writeFileSync(settingsFile, JSON.stringify(SYSTEM_SETTINGS, null, 2));
    } catch (error) {
        console.error('Error saving system settings:', error);
    }
}

// Clear cache
async function clearCache() {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        let clearedCount = 0;
        
        for (const file of files) {
            try {
                fs.unlinkSync(path.join(CACHE_DIR, file));
                clearedCount++;
            } catch (error) {
                console.error(`Error deleting ${file}:`, error);
            }
        }
        
        SYSTEM_SETTINGS.lastClearTime = Date.now();
        saveSettings();
        
        return clearedCount;
    } catch (error) {
        console.error('Error clearing cache:', error);
        return 0;
    }
}

// Change DP
async function changeDP(zk) {
    if (SYSTEM_SETTINGS.dpImages.length === 0) return;
    
    try {
        const dpPath = path.join(DP_DIR, SYSTEM_SETTINGS.dpImages[SYSTEM_SETTINGS.currentDpIndex]);
        const dpBuffer = fs.readFileSync(dpPath);
        
        await zk.updateProfilePicture(zk.user.id, dpBuffer);
        
        SYSTEM_SETTINGS.currentDpIndex = (SYSTEM_SETTINGS.currentDpIndex + 1) % SYSTEM_SETTINGS.dpImages.length;
        SYSTEM_SETTINGS.lastDpChangeTime = Date.now();
        saveSettings();
    } catch (error) {
        console.error('Error changing DP:', error);
    }
}

// Broadcast message
async function broadcast(zk, message) {
    try {
        const broadcastData = JSON.parse(fs.readFileSync(BROADCAST_FILE));
        const groups = broadcastData.groups || [];
        
        for (const group of groups) {
            try {
                await zk.sendMessage(group, { text: message });
            } catch (error) {
                console.error(`Error broadcasting to ${group}:`, error);
            }
        }
    } catch (error) {
        console.error('Error broadcasting:', error);
    }
}

// Tag all members
async function tagAll(zk, groupId) {
    try {
        const metadata = await zk.groupMetadata(groupId);
        const participants = metadata.participants;
        let tags = '';
        
        for (const participant of participants) {
            tags += `@${participant.id.split('@')[0]} `;
        }
        
        await zk.sendMessage(groupId, { text: tags });
    } catch (error) {
        console.error('Error tagging all:', error);
    }
}

// Hide tag
async function hideTag(zk, groupId, message) {
    try {
        const metadata = await zk.groupMetadata(groupId);
        const participants = metadata.participants;
        let hiddenTags = '';
        
        for (const participant of participants) {
            hiddenTags += `‎ @${participant.id.split('@')[0]} `;
        }
        
        await zk.sendMessage(groupId, { text: `${message}\n${hiddenTags}` });
    } catch (error) {
        console.error('Error hiding tag:', error);
    }
}

// Command handler
async function execute(message, zk, options) {
    const args = message.body.split(' ').slice(1);
    const command = args[0];

    switch (command) {
        case 'clearcache':
            const cleared = await clearCache();
            await zk.sendMessage(message.from, { 
                text: `✅ Cache cleared successfully!\nRemoved ${cleared} files.` 
            });
            break;

        case 'uptime':
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            await zk.sendMessage(message.from, {
                text: `*⏱️ Bot Uptime*\n\n` +
                      `Hours: ${hours}\n` +
                      `Minutes: ${minutes}\n` +
                      `Seconds: ${seconds}`
            });
            break;

        case 'ping':
            const start = Date.now();
            await zk.sendMessage(message.from, { text: '🏓 Pong!' });
            const latency = Date.now() - start;
            
            await zk.sendMessage(message.from, {
                text: `*🏓 Pong!*\n\n` +
                      `Latency: ${latency}ms\n` +
                      `Server Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`
            });
            break;

        case 'sleep':
            if (args.length < 2) {
                await zk.sendMessage(message.from, { 
                    text: '❌ Please provide a time duration.\nExample: sleep 5s (seconds)\nsleep 2m (minutes)\nsleep 1h (hours)' 
                });
                return;
            }

            const timeStr = args[1].toLowerCase();
            let sleepTime = 0;

            if (timeStr.endsWith('s')) {
                sleepTime = parseInt(timeStr) * 1000; // seconds to milliseconds
            } else if (timeStr.endsWith('m')) {
                sleepTime = parseInt(timeStr) * 60 * 1000; // minutes to milliseconds
            } else if (timeStr.endsWith('h')) {
                sleepTime = parseInt(timeStr) * 60 * 60 * 1000; // hours to milliseconds
            } else {
                await zk.sendMessage(message.from, { 
                    text: '❌ Invalid time format. Use:\ns - seconds\nm - minutes\nh - hours\nExample: sleep 5s' 
                });
                return;
            }

            if (isNaN(sleepTime) || sleepTime <= 0) {
                await zk.sendMessage(message.from, { 
                    text: '❌ Invalid time value. Please provide a positive number.' 
                });
                return;
            }

            await zk.sendMessage(message.from, { 
                text: `😴 Bot will sleep for ${timeStr}...` 
            });
            
            setTimeout(() => {
                process.exit(0);
            }, sleepTime);
            break;

        case 'restart':
            await zk.sendMessage(message.from, { text: '🔄 Bot is restarting...' });
            exec('pm2 restart magnus-bot');
            break;

        case 'adddp':
            if (!message.hasMedia) {
                await zk.sendMessage(message.from, { text: '❌ Please send an image with the command.' });
                return;
            }
            
            try {
                const media = await message.download();
                const fileName = `dp_${Date.now()}.jpg`;
                fs.writeFileSync(path.join(DP_DIR, fileName), media);
                
                SYSTEM_SETTINGS.dpImages.push(fileName);
                saveSettings();
                
                await zk.sendMessage(message.from, { text: '✅ DP image added successfully!' });
            } catch (error) {
                console.error('Error adding DP:', error);
                await zk.sendMessage(message.from, { text: '❌ Error adding DP image.' });
            }
            break;

        case 'broadcast':
            if (args.length < 2) {
                await zk.sendMessage(message.from, { text: '❌ Please provide a message to broadcast.' });
                return;
            }
            
            const broadcastMessage = args.slice(1).join(' ');
            await broadcast(zk, broadcastMessage);
            await zk.sendMessage(message.from, { text: '✅ Broadcast sent successfully!' });
            break;

        case 'tagall':
            if (!message.isGroup) {
                await zk.sendMessage(message.from, { text: '❌ This command can only be used in groups.' });
                return;
            }
            
            await tagAll(zk, message.from);
            break;

        case 'hidetag':
            if (!message.isGroup) {
                await zk.sendMessage(message.from, { text: '❌ This command can only be used in groups.' });
                return;
            }
            
            const tagMessage = args.slice(1).join(' ') || 'Hidden Tag';
            await hideTag(zk, message.from, tagMessage);
            break;

        case 'delete':
            if (!message.isQuoted) {
                await zk.sendMessage(message.from, { text: '❌ Please reply to the message you want to delete.' });
                return;
            }
            
            try {
                await zk.sendMessage(message.from, { delete: message.quoted.key });
                await zk.sendMessage(message.from, { text: '✅ Message deleted successfully!' });
            } catch (error) {
                console.error('Error deleting message:', error);
                await zk.sendMessage(message.from, { text: '❌ Error deleting message.' });
            }
            break;

        default:
            await zk.sendMessage(message.from, {
                text: '*⚙️ System Commands*\n\n' +
                      '• clearcache - Clear bot cache\n' +
                      '• uptime - Show bot uptime\n' +
                      '• ping - Check bot latency\n' +
                      '• sleep - Put bot to sleep\n' +
                      '• restart - Restart the bot\n' +
                      '• adddp <image> - Add DP image\n' +
                      '• broadcast <message> - Broadcast message\n' +
                      '• tagall - Tag all group members\n' +
                      '• hidetag <message> - Hide tag members\n' +
                      '• delete - Delete replied message'
            });
    }
}

// Start auto-clear cache interval
setInterval(async () => {
    if (SYSTEM_SETTINGS.autoClearCache) {
        await clearCache();
    }
}, SYSTEM_SETTINGS.clearInterval);

// Start auto-change DP interval
setInterval(async () => {
    await changeDP(zk);
}, SYSTEM_SETTINGS.dpChangeInterval);

module.exports = {
    name: 'system',
    execute
}; 