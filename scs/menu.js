const config = require('../config.env');

// Available Goten images for menus
const menuImages = [
    'https://goten-bot.onrender.com/assets/images/goten_standing.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_happy_jumping.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_flying_happy.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_arms_up.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_adult_light.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_neon.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_happy_blushing_pause.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_and_trunks_ssj1_back_on_back_cheers.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_ssj1_bruised_sad.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_wasted_ssj3_angry_bruised.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_ss_god_red_holding spirit bomb_looking curius.jpg',
    'https://goten-bot.onrender.com/assets/images/goten_x_trunks_ssj1_playing.jpg'
];

// Function to get random menu image
function getRandomMenuImage() {
    return menuImages[Math.floor(Math.random() * menuImages.length)];
}

// Menu formats with modern ASCII art
const menuFormats = [
    {
        title: `
╭━━━•✬❘༻ 🐉 GOTEN BOT ༺❘✬•━━━╮
┃    Welcome to the Command List    ┃
╰━━━•✬❘༻ Version 1.0 ༺❘✬•━━━╯`,
        header: `
╭━━━━━━━━━ BOT INFO ━━━━━━━━━╮
┃ ◈ Bot: Goten                 ┃
┃ ◈ Version: 1.0              ┃
┃ ◈ Developer: Ecnord         ┃
┃ ◈ Prefix: .                 ┃
┃ ◈ Mode: Public              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
        footer: `
╭━━━━━━━━━ CREDITS ━━━━━━━━━╮
┃    Developed with 💖 by     ┃
┃         ECNORD             ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
  More features coming soon!`
    },
    {
        title: `
▀▄▀▄▀▄ GOTEN BOT ▄▀▄▀▄▀
   Dragon Warrior Edition   
━━━━━━━━━━━━━━━━━━━━━━`,
        header: `
┏━━━━━━ BOT DETAILS ━━━━━━┓
┃ 🐉 Name: Goten          ┃
┃ 📱 Version: 1.0        ┃
┃ 👨‍💻 Dev: Ecnord         ┃
┃ ⚡ Prefix: .           ┃
┃ 🌐 Mode: Public        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛`,
        footer: `
┏━━━━━━ POWERED BY ━━━━━━┓
┃      E C N O R D       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛`
    },
    {
        title: `
╔══════════════════════╗
║  🎮 GOTEN GAMING 🎮  ║
║     Command Menu      ║
╚══════════════════════╝`,
        header: `
╔═══ Bot Statistics ═══╗
║ Bot: Goten          ║
║ Version: 1.0        ║
║ Creator: Ecnord     ║
║ Prefix: .           ║
║ Status: Online      ║
╚════════════════════╝`,
        footer: `
╔════ Thank You! ════╗
║    Made by Ecnord   ║
╚════════════════════╝`
    },
    {
        title: `
┌─────────────────────┐
│   GOTEN BOT v1.0    │
│ Your Digital Friend │
└─────────────────────┘`,
        header: `
┌─── Bot Profile ────┐
│ Name: Goten       │
│ Version: 1.0      │
│ Author: Ecnord    │
│ Prefix: .         │
│ Mode: Public      │
└──────────────────┘`,
        footer: `
┌─── Credits ───┐
│   By Ecnord   │
└──────────────┘`
    },
    {
        title: `
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ 🐉 GOTEN BOT 🐉 █
█ Command Center  █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
        header: `
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ Bot: Goten     █
█ Ver: 1.0       █
█ Dev: Ecnord    █
█ Prefix: .      █
█ Mode: Public   █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
        footer: `
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ By: Ecnord  █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`
    }
];

// Command categories with emojis
const categories = [
    {
        name: "👑 OWNER COMMANDS",
        commands: [
            { index: 1, cmd: "block", desc: "Block user from bot" },
            { index: 2, cmd: "unblock", desc: "Unblock user from bot" },
            { index: 3, cmd: "join", desc: "Join a group via link" },
            { index: 4, cmd: "leave", desc: "Leave current group" },
            { index: 5, cmd: "setvar", desc: "Set bot variables" },
            { index: 6, cmd: "restart", desc: "Restart bot system" },
            { index: 7, cmd: "pp", desc: "Set bot profile picture" },
            { index: 8, cmd: "ownerreact", desc: "Special owner reactions" },
            { index: 9, cmd: "heartreact", desc: "Send heart reactions" },
            { index: 10, cmd: "broadcast", desc: "Send broadcast message" },
            { index: 11, cmd: "del", desc: "Delete bot's message" },
            { index: 12, cmd: "save", desc: "Save media to bot" },
            { index: 13, cmd: "report", desc: "Report bugs to dev" },
            { index: 14, cmd: "jid", desc: "Get chat/user JID" }
        ]
    },
    {
        name: "🔍 SEARCH TOOLS",
        commands: [
            { index: 15, cmd: "yts", desc: "Search YouTube videos" },
            { index: 16, cmd: "google", desc: "Google web search" },
            { index: 17, cmd: "imdb", desc: "Search movies/shows" },
            { index: 18, cmd: "img", desc: "Find images online" },
            { index: 19, cmd: "weather", desc: "Get weather updates" },
            { index: 20, cmd: "playstore", desc: "Search Play Store apps" },
            { index: 21, cmd: "news", desc: "Get latest news" }
        ]
    },
    {
        name: "🤖 AI & TOOLS",
        commands: [
            { index: 22, cmd: "blackboxai", desc: "Code with BlackBox AI" },
            { index: 23, cmd: "gpt", desc: "Chat with GPT" },
            { index: 24, cmd: "visit", desc: "Visit & preview URLs" },
            { index: 25, cmd: "define", desc: "Define words & terms" }
        ]
    },
    {
        name: "🔄 CONVERTERS",
        commands: [
            { index: 26, cmd: "attp", desc: "Text to colorful sticker" },
            { index: 27, cmd: "url", desc: "Media to direct link" },
            { index: 28, cmd: "attp3", desc: "Text to animated sticker" },
            { index: 29, cmd: "ebinary", desc: "Text to binary code" },
            { index: 30, cmd: "dbinary", desc: "Binary to text" },
            { index: 31, cmd: "emojimix", desc: "Combine two emojis" },
            { index: 32, cmd: "mp3", desc: "Video to audio" }
        ]
    },
    {
        name: "📥 DOWNLOADERS",
        commands: [
            { index: 33, cmd: "fb", desc: "Download Facebook videos" },
            { index: 34, cmd: "insta", desc: "Download Instagram content" },
            { index: 35, cmd: "video", desc: "Download YouTube videos" },
            { index: 36, cmd: "gdrive", desc: "Download from Drive" },
            { index: 37, cmd: "twitter", desc: "Download Twitter media" },
            { index: 38, cmd: "tiktok", desc: "Download TikTok videos" },
            { index: 39, cmd: "mediafire", desc: "Download MediaFire files" },
            { index: 40, cmd: "song", desc: "Download music tracks" },
            { index: 41, cmd: "apk", desc: "Download Android apps" },
            { index: 42, cmd: "ttaudio", desc: "Download TikTok audio" }
        ]
    },
    {
        name: "👥 GROUP ADMIN",
        commands: [
            { index: 43, cmd: "del", desc: "Delete messages" },
            { index: 44, cmd: "add", desc: "Add new members" },
            { index: 45, cmd: "kick", desc: "Remove members" },
            { index: 46, cmd: "welcome", desc: "Welcome message settings" },
            { index: 47, cmd: "promote", desc: "Make group admin" },
            { index: 48, cmd: "demote", desc: "Remove admin status" },
            { index: 49, cmd: "tagall", desc: "Mention all members" },
            { index: 50, cmd: "hidetag", desc: "Hidden announcements" },
            { index: 51, cmd: "invite", desc: "Get group invite link" },
            { index: 52, cmd: "mute", desc: "Mute group chat" },
            { index: 53, cmd: "unmute", desc: "Unmute group chat" },
            { index: 54, cmd: "groupopen", desc: "Open group settings" },
            { index: 55, cmd: "groupclose", desc: "Close group settings" },
            { index: 56, cmd: "groupinfo", desc: "Group information" },
            { index: 57, cmd: "poll", desc: "Create group polls" }
        ]
    },
    {
        name: "🎵 AUDIO EFFECTS",
        commands: [
            { index: 58, cmd: "deep", desc: "Deep voice effect" },
            { index: 59, cmd: "bass", desc: "Enhanced bass" },
            { index: 60, cmd: "robot", desc: "Robotic voice" },
            { index: 61, cmd: "reverse", desc: "Reverse audio" },
            { index: 62, cmd: "slow", desc: "Slow motion audio" },
            { index: 63, cmd: "smooth", desc: "Smooth audio effect" },
            { index: 64, cmd: "nightcore", desc: "Nightcore remix" }
        ]
    },
    {
        name: "🎯 FUN STICKERS",
        commands: [
            { index: 65, cmd: "dance", desc: "Dancing sticker" },
            { index: 66, cmd: "poke", desc: "Poke someone" },
            { index: 67, cmd: "wink", desc: "Winking face" },
            { index: 68, cmd: "happ", desc: "Happy mood" },
            { index: 69, cmd: "kick", desc: "Kicking action" },
            { index: 70, cmd: "kill", desc: "Dramatic effect" },
            { index: 71, cmd: "slap", desc: "Slapping sticker" },
            { index: 72, cmd: "bite", desc: "Biting action" },
            { index: 73, cmd: "nom", desc: "Eating action" },
            { index: 74, cmd: "highfive", desc: "High five gesture" },
            { index: 75, cmd: "wave", desc: "Waving hand" },
            { index: 76, cmd: "smile", desc: "Happy smile" },
            { index: 77, cmd: "blush", desc: "Blushing face" },
            { index: 78, cmd: "yeet", desc: "Yeet meme" },
            { index: 79, cmd: "bonk", desc: "Bonk meme" },
            { index: 80, cmd: "smug", desc: "Smug face" },
            { index: 81, cmd: "pat", desc: "Pat someone" },
            { index: 82, cmd: "lick", desc: "Licking action" },
            { index: 83, cmd: "kiss", desc: "Kissing emoji" },
            { index: 84, cmd: "awoo", desc: "Cute awoo" },
            { index: 85, cmd: "hug", desc: "Hugging sticker" },
            { index: 86, cmd: "cry", desc: "Crying face" },
            { index: 87, cmd: "cuddle", desc: "Cuddling action" },
            { index: 88, cmd: "bully", desc: "Playful bully" }
        ]
    },
    {
        name: "🎨 LOGO MAKER",
        commands: [
            { index: 89, cmd: "logo", desc: "Custom text logo" },
            { index: 90, cmd: "hacker", desc: "Hacker style text" },
            { index: 91, cmd: "blackpink", desc: "BLACKPINK style" },
            { index: 92, cmd: "gossysilver", desc: "Silver text effect" },
            { index: 93, cmd: "naruto", desc: "Naruto themed" },
            { index: 94, cmd: "digitalglitch", desc: "Glitch effect" },
            { index: 95, cmd: "pixelglitch", desc: "Pixel art glitch" },
            { index: 96, cmd: "star", desc: "Starry text" },
            { index: 97, cmd: "smoke", desc: "Smoke text" },
            { index: 98, cmd: "bear", desc: "Bear themed" },
            { index: 99, cmd: "neondevil", desc: "Neon devil style" },
            { index: 100, cmd: "screen", desc: "Screen effect" },
            { index: 101, cmd: "nature", desc: "Nature themed" },
            { index: 102, cmd: "dragonball", desc: "Dragon Ball style" },
            { index: 103, cmd: "foggyglass", desc: "Foggy glass text" },
            { index: 104, cmd: "neonlight", desc: "Neon light text" },
            { index: 105, cmd: "castlepop", desc: "Castle pop art" },
            { index: 106, cmd: "frozenchristmas", desc: "Frozen theme" },
            { index: 107, cmd: "foilballoon", desc: "Balloon text" },
            { index: 108, cmd: "colorfulpaint", desc: "Paint splash" },
            { index: 109, cmd: "americanflag", desc: "USA flag style" },
            { index: 110, cmd: "water", desc: "Water effect" },
            { index: 111, cmd: "underwater", desc: "Underwater text" },
            { index: 112, cmd: "dragonfire", desc: "Dragon fire text" },
            { index: 113, cmd: "bokeh", desc: "Bokeh light effect" },
            { index: 114, cmd: "snow", desc: "Snowy text" },
            { index: 115, cmd: "sand3d", desc: "3D sand text" },
            { index: 116, cmd: "pubg", desc: "PUBG style" },
            { index: 117, cmd: "horror", desc: "Horror text" },
            { index: 118, cmd: "blood", desc: "Blood drip text" },
            { index: 119, cmd: "bulb", desc: "Light bulb text" },
            { index: 120, cmd: "graffiti", desc: "Street art style" },
            { index: 121, cmd: "thunder", desc: "Thunder effect" },
            { index: 122, cmd: "womensday", desc: "Women's Day theme" },
            { index: 123, cmd: "valentine", desc: "Valentine's style" },
            { index: 124, cmd: "graffiti2", desc: "Modern graffiti" },
            { index: 125, cmd: "queencard", desc: "Queen card design" },
            { index: 126, cmd: "galaxy", desc: "Galaxy text effect" }
        ]
    }
];

// Get random menu
function getRandomMenu() {
    const menu = menuFormats[Math.floor(Math.random() * menuFormats.length)];
    return { ...menu, image: getRandomMenuImage() };
}

// Format menu with categories and commands
function formatMenu(menu) {
    let formattedMenu = `${menu.title}\n${menu.header}\n\n`;
    
    // Add categories and commands
    categories.forEach(category => {
        formattedMenu += `${category.name}\n`;
        category.commands.forEach(cmd => {
            formattedMenu += `${cmd.index}. .${cmd.cmd} - ${cmd.desc}\n`;
        });
        formattedMenu += '\n';
    });
    
    // Add footer with current time
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    formattedMenu += `${menu.footer}\n`;
    formattedMenu += `Current Time: ${timeString}\n`;
    formattedMenu += `Type a number or .help for more info\n`;
    
    return formattedMenu;
}

// Get command by index
function getCommandByIndex(index) {
    for (const category of categories) {
        const command = category.commands.find(cmd => cmd.index === index);
        if (command) {
            return command.cmd;
        }
    }
    return null;
}

// Export functions
module.exports = {
    getRandomMenu,
    formatMenu,
    getCommandByIndex,
    getRandomMenuImage,
    categories
};

async function generateHelpMenu() {
    return `╭─────────────━┈⊷
│ GOTEN Help Menu
╰─────────────━┈⊷

╭─────────────━┈⊷
│ 📱 Contact & Support:
│ • Telegram: t.me/botGOTEN
│ • WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6
│ • WhatsApp Channel: https://whatsapp.com/channel/0029VaevRgSEwEjnvksGQp2K
│
│ 📋 Available Commands:
// ... existing code ...
`;
}
