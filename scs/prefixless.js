const config = require('../config.env');
const fs = require('fs');
const path = require('path');
const { getRandomMenu, formatMenu, getCommandByIndex } = require('./menu');
const { generateShengResponse } = require('./sheng');

// Command registry
const commands = new Map();
const commandAliases = new Map();

// Load all command modules
const commandFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && !['prefixless.js', 'menu.js', 'ai.js', 'sheng.js'].includes(file));

for (const file of commandFiles) {
    try {
        const command = require(path.join(__dirname, file));
        if (command.nomCom) {
            const commandName = command.nomCom.toLowerCase();
            commands.set(commandName, command);
            
            // Register aliases if any
            if (command.aliases) {
                command.aliases.forEach(alias => {
                    commandAliases.set(alias.toLowerCase(), commandName);
                });
            }
        }
    } catch (error) {
        console.error(`Error loading command from ${file}:`, error);
    }
}

// Command handler
async function handleCommand(message, zk, options) {
    const { repondre } = options;
    
    if (!message.body) {
        return false;
    }

    const text = message.body.toLowerCase().trim();
    const userId = message.key.participant || message.key.remoteJid;
    
    // Handle menu command
    if (text === 'menu' || text === 'help' || text === '?') {
        const menu = getRandomMenu();
        await repondre(formatMenu(menu));
        return true;
    }
    
    // Check if input is a number (command index)
    const index = parseInt(text);
    if (!isNaN(index)) {
        const commandName = getCommandByIndex(index);
        if (commandName) {
            const command = commands.get(commandName);
            if (command) {
                try {
                    await command.execute(message, zk, options);
                    return true;
                } catch (error) {
                    console.error(`Error executing command ${commandName}:`, error);
                    await repondre('❌ An error occurred while processing your command. Please try again later.');
                    return true;
                }
            }
        }
        await repondre(`❌ Invalid command index: ${index}`);
        return true;
    }
    
    // Check for direct command or alias
    const [commandPart, ...args] = text.split(' ');
    const commandName = commandAliases.get(commandPart) || commandPart;
    const command = commands.get(commandName);
    
    if (command) {
        try {
            // Check owner-only commands
            if (command.ownerOnly && !config.OWNER_NUMBER.includes(userId)) {
                await repondre('❌ This command is only available to the bot owner.');
                return true;
            }
            
            // Check group-only commands
            if (command.groupOnly && !message.key.remoteJid.endsWith('@g.us')) {
                await repondre('❌ This command can only be used in groups.');
                return true;
            }
            
            await command.execute(message, zk, {
                ...options,
                arg: args
            });
            return true;
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await repondre('❌ An error occurred while processing your command. Please try again later.');
            return true;
        }
    }
    
    // Try Sheng mode if enabled
    if (config.SHENG_MODE === 'yes') {
        const shengResponse = await generateShengResponse(message, zk, options);
        if (shengResponse) {
            return true;
        }
    }
    
    // If no command matched and AI is enabled, try AI response
    if (config.AI_ENABLED === 'yes') {
        try {
            const aiHandler = require('./ai');
            const response = await aiHandler.handleAIRequest(text, userId);
            
            if (response.success) {
                await repondre(response.response);
                return true;
            } else if (response.error) {
                await repondre(`❌ ${response.error}`);
                return true;
            }
        } catch (error) {
            console.error('AI response error:', error);
            await repondre('❌ An error occurred while processing your AI request. Please try again later.');
            return true;
        }
    }
    
    return false;
}

module.exports = {
    handleCommand,
    commands
}; 