//=====================//
//     Bwm xmd         //
//     © 2025          //
//=====================//

const axios = require('axios');
const cheerio = require('cheerio');
const config = require(__dirname + "/../config");
const moment = require('moment-timezone');
const { exec } = require('child_process');

async function fetchAliveUrl() {
  try {
    const response = await axios.get(config.BWM_XMD);
    const $ = cheerio.load(response.data);

    const aliveUrlElement = $('a:contains("ALIVE_URL")');
    const aliveUrl = aliveUrlElement.attr('href');

    if (!aliveUrl) {
      throw new Error('Alive URL link not found...');
    }

    console.log('Alive URL fetched successfully ✅');
    return aliveUrl;

  } catch (error) {
    console.error('Error fetching alive URL:', error.message);
    return null;
  }
}

// Alive message settings
const ALIVE_SETTINGS = {
    enabled: process.env.ALIVE_MESSAGE === "yes",
    interval: parseTimeInterval(process.env.ALIVE_INTERVAL || "5m"),
    lastSent: 0,
    supportGroup: process.env.SUPPORT_GROUP || "https://chat.whatsapp.com/JLFAlCXdXMh8lT4sxHplvG"
};

// Parse time interval string (e.g., "5m", "1h")
function parseTimeInterval(interval) {
    const value = parseInt(interval);
    if (interval.endsWith('s')) return value * 1000;
    if (interval.endsWith('m')) return value * 60 * 1000;
    if (interval.endsWith('h')) return value * 60 * 60 * 1000;
    return 5 * 60 * 1000; // Default 5 minutes
}

// Get system info
async function getSystemInfo() {
    return new Promise((resolve) => {
        exec('free -m', (error, stdout) => {
            if (error) {
                resolve({ memory: 'N/A', uptime: process.uptime() });
                return;
            }
            
            const lines = stdout.split('\n');
            const memory = lines[1].split(/\s+/);
            const used = parseInt(memory[2]);
            const total = parseInt(memory[1]);
            const usage = ((used / total) * 100).toFixed(1);
            
            resolve({
                memory: `${usage}% (${used}MB/${total}MB)`,
                uptime: process.uptime()
            });
        });
    });
}

// Format uptime
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let uptime = '';
    if (days > 0) uptime += `${days}d `;
    if (hours > 0) uptime += `${hours}h `;
    uptime += `${minutes}m`;
    
    return uptime;
}

// Generate alive message
async function generateAliveMessage(zk) {
    const info = await getSystemInfo();
    const uptime = formatUptime(info.uptime);
    
    return `╭─────────────━┈⊷
│ GOTEN
╰─────────────━┈⊷

╭─────────────━┈⊷
│ Bot connected successfully
│ 
│ 📱 Contact & Support:
│ • Telegram: t.me/botGOTEN
│ • WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6
│ • WhatsApp Channel: https://whatsapp.com/channel/0029VaevRgSEwEjnvksGQp2K
│
│ 📊 System Status:
│ • Uptime: ${uptime}
│ • Memory: ${info.memory}
│
╰─────────────━┈⊷

> Regards GOTEN`;
}

// Send alive message
async function sendAliveMessage(zk) {
    if (!ALIVE_SETTINGS.enabled) return;
    
    const now = Date.now();
    if (now - ALIVE_SETTINGS.lastSent < ALIVE_SETTINGS.interval) return;
    
    try {
        const message = await generateAliveMessage(zk);
        await zk.sendMessage(process.env.OWNER_NUMBER + '@s.whatsapp.net', { text: message });
        ALIVE_SETTINGS.lastSent = now;
    } catch (error) {
        console.error('Error sending alive message:', error);
    }
}

// Command handler
async function execute(message, zk, options) {
    const args = message.body.split(' ').slice(1);
    const command = args[0];

    switch (command) {
        case 'on':
            ALIVE_SETTINGS.enabled = true;
            await zk.sendMessage(message.from, { 
                text: '✅ Alive messages enabled!' 
            });
            break;

        case 'off':
            ALIVE_SETTINGS.enabled = false;
            await zk.sendMessage(message.from, { 
                text: '❌ Alive messages disabled!' 
            });
            break;

        case 'interval':
            if (args.length < 2) {
                await zk.sendMessage(message.from, { 
                    text: '❌ Please provide an interval.\nExample: alive interval 5m' 
                });
                return;
            }
            
            const newInterval = parseTimeInterval(args[1]);
            ALIVE_SETTINGS.interval = newInterval;
            
            await zk.sendMessage(message.from, { 
                text: `✅ Alive message interval set to ${args[1]}` 
            });
            break;

        case 'test':
            const testMessage = await generateAliveMessage(zk);
            await zk.sendMessage(message.from, { text: testMessage });
            break;

        default:
            await zk.sendMessage(message.from, {
                text: '*🔄 Alive Message Settings*\n\n' +
                      '• alive on - Enable alive messages\n' +
                      '• alive off - Disable alive messages\n' +
                      '• alive interval <time> - Set interval (e.g., 5m, 1h)\n' +
                      '• alive test - Test alive message'
            });
    }
}

// Start alive message interval
let aliveInterval;
function startAliveInterval(zkInstance) {
  if (aliveInterval) {
    clearInterval(aliveInterval);
  }
  
  aliveInterval = setInterval(async () => {
    if (zkInstance && ALIVE_SETTINGS.enabled) {
      await sendAliveMessage(zkInstance);
    }
  }, ALIVE_SETTINGS.interval);
}

module.exports = {
    name: 'alive',
    execute,
    startAliveInterval
};

//=====================//
//     © 2025          //
//=====================//
