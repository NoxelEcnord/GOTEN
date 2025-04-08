const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const MONITOR_DIR = path.join(__dirname, '../monitor');
const STATUS_DIR = path.join(MONITOR_DIR, 'status');
const DELETED_DIR = path.join(MONITOR_DIR, 'deleted');
const VIEWONCE_DIR = path.join(MONITOR_DIR, 'viewonce');

// Create directories if they don't exist
if (!fs.existsSync(MONITOR_DIR)) fs.mkdirSync(MONITOR_DIR);
if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR);
if (!fs.existsSync(DELETED_DIR)) fs.mkdirSync(DELETED_DIR);
if (!fs.existsSync(VIEWONCE_DIR)) fs.mkdirSync(VIEWONCE_DIR);

// Default settings
const DEFAULT_SETTINGS = {
    statusSave: false,
    statusReply: false,
    antiViewOnce: true,
    antiDelete: true
};

// Load settings
let settings = DEFAULT_SETTINGS;
try {
    const settingsFile = path.join(MONITOR_DIR, 'settings.json');
    if (fs.existsSync(settingsFile)) {
        settings = JSON.parse(fs.readFileSync(settingsFile));
    } else {
        fs.writeFileSync(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
} catch (error) {
    console.error('Error loading settings:', error);
}

// Save settings
function saveSettings() {
    try {
        const settingsFile = path.join(MONITOR_DIR, 'settings.json');
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Handle status updates
async function handleStatusUpdate(message, zk) {
    if (!settings.statusSave) return;

    try {
        const status = message.status;
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const fileName = path.join(STATUS_DIR, `status_${timestamp}.jpg`);
        
        // Download status
        const buffer = await downloadContentFromMessage(message, 'image');
        fs.writeFileSync(fileName, buffer);

        // Send to developer
        await zk.sendMessage(settings.developerNumber, {
            text: `*📱 New Status Update*\n\n` +
                  `From: ${message.pushName}\n` +
                  `Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n` +
                  `Type: ${status.type}\n` +
                  `Duration: ${status.duration}s`
        });
    } catch (error) {
        console.error('Error handling status update:', error);
    }
}

// Handle view-once messages
async function handleViewOnce(message, zk) {
    if (!settings.antiViewOnce) return;

    try {
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const fileName = path.join(VIEWONCE_DIR, `viewonce_${timestamp}.jpg`);
        
        // Download view-once content
        const buffer = await downloadContentFromMessage(message, 'image');
        fs.writeFileSync(fileName, buffer);

        // Get sender and group info
        const sender = message.pushName;
        const group = message.isGroup ? await zk.groupMetadata(message.from) : null;
        const groupName = group ? group.subject : 'Private Chat';

        // Send to developer
        await zk.sendMessage(settings.developerNumber, {
            text: `*👀 View-Once Message Captured*\n\n` +
                  `From: ${sender}\n` +
                  `Group: ${groupName}\n` +
                  `Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n` +
                  `Type: ${message.type}`
        });

        // Send to original chat with delay
        await zk.sendMessage(message.from, {
            text: `*⚠️ View-Once Message Captured*\n\n` +
                  `From: ${sender}\n` +
                  `Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`
        });

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Send the actual content
        await zk.sendMessage(message.from, {
            image: buffer,
            caption: `*Original View-Once Message*\n` +
                    `Apologies for resending, but this message was marked as view-once.`
        });
    } catch (error) {
        console.error('Error handling view-once message:', error);
    }
}

// Handle deleted messages
async function handleDeletedMessage(message, zk) {
    if (!settings.antiDelete) return;

    try {
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const fileName = path.join(DELETED_DIR, `deleted_${timestamp}.json`);
        
        // Save message details
        const messageInfo = {
            sender: message.pushName,
            content: message.body,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            group: message.isGroup ? await zk.groupMetadata(message.from) : null,
            type: message.type
        };
        fs.writeFileSync(fileName, JSON.stringify(messageInfo, null, 2));

        // Get group info
        const group = message.isGroup ? await zk.groupMetadata(message.from) : null;
        const groupName = group ? group.subject : 'Private Chat';

        // Send to developer
        await zk.sendMessage(settings.developerNumber, {
            text: `*🗑️ Deleted Message Captured*\n\n` +
                  `From: ${messageInfo.sender}\n` +
                  `Group: ${groupName}\n` +
                  `Time: ${messageInfo.timestamp}\n` +
                  `Type: ${messageInfo.type}\n` +
                  `Content: ${messageInfo.content}\n\n` +
                  `*Bot Info:*\n` +
                  `Name: ${settings.botName}\n` +
                  `Developer: ${settings.developerName}\n` +
                  `Contact: ${settings.developerContact}`
        });

        // Send to original chat with delay
        await zk.sendMessage(message.from, {
            text: `*⚠️ Deleted Message Captured*\n\n` +
                  `From: ${messageInfo.sender}\n` +
                  `Time: ${messageInfo.timestamp}`
        });

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Send the actual content
        await zk.sendMessage(message.from, {
            text: `*Original Message:*\n${messageInfo.content}\n\n` +
                  `Apologies for resending, but this message was deleted.`
        });
    } catch (error) {
        console.error('Error handling deleted message:', error);
    }
}

// Command handler
async function execute(message, zk, options) {
    const args = message.body.split(' ').slice(1);
    const command = args[0];

    switch (command) {
        case 'status':
            if (args[1] === 'on') {
                settings.statusSave = true;
                settings.statusReply = true;
                saveSettings();
                await zk.sendMessage(message.from, { text: '✅ Status monitoring enabled' });
            } else if (args[1] === 'off') {
                settings.statusSave = false;
                settings.statusReply = false;
                saveSettings();
                await zk.sendMessage(message.from, { text: '❌ Status monitoring disabled' });
            } else {
                await zk.sendMessage(message.from, {
                    text: '*📱 Status Monitor*\n\n' +
                          'Commands:\n' +
                          '• status on - Enable status monitoring\n' +
                          '• status off - Disable status monitoring\n\n' +
                          'Current Settings:\n' +
                          `Status Save: ${settings.statusSave ? '✅' : '❌'}\n` +
                          `Status Reply: ${settings.statusReply ? '✅' : '❌'}\n` +
                          `Anti View-Once: ${settings.antiViewOnce ? '✅' : '❌'}\n` +
                          `Anti Delete: ${settings.antiDelete ? '✅' : '❌'}`
                });
            }
            break;

        case 'viewonce':
            if (args[1] === 'on') {
                settings.antiViewOnce = true;
                saveSettings();
                await zk.sendMessage(message.from, { text: '✅ View-once monitoring enabled' });
            } else if (args[1] === 'off') {
                settings.antiViewOnce = false;
                saveSettings();
                await zk.sendMessage(message.from, { text: '❌ View-once monitoring disabled' });
            }
            break;

        case 'antidelete':
            if (args[1] === 'on') {
                settings.antiDelete = true;
                saveSettings();
                await zk.sendMessage(message.from, { text: '✅ Anti-delete enabled' });
            } else if (args[1] === 'off') {
                settings.antiDelete = false;
                saveSettings();
                await zk.sendMessage(message.from, { text: '❌ Anti-delete disabled' });
            }
            break;

        default:
            await zk.sendMessage(message.from, {
                text: '*👁️ Message Monitor*\n\n' +
                      'Commands:\n' +
                      '• status on/off - Toggle status monitoring\n' +
                      '• viewonce on/off - Toggle view-once monitoring\n' +
                      '• antidelete on/off - Toggle anti-delete\n\n' +
                      'Current Settings:\n' +
                      `Status Save: ${settings.statusSave ? '✅' : '❌'}\n` +
                      `Status Reply: ${settings.statusReply ? '✅' : '❌'}\n` +
                      `Anti View-Once: ${settings.antiViewOnce ? '✅' : '❌'}\n` +
                      `Anti Delete: ${settings.antiDelete ? '✅' : '❌'}`
            });
    }
}

module.exports = {
    name: 'monitor',
    execute,
    handleStatusUpdate,
    handleViewOnce,
    handleDeletedMessage
}; 