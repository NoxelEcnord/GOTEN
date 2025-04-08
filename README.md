# 🐉 Goten Bot

A powerful WhatsApp bot with AI capabilities, media handling, games, and Goten-themed features!

## ✨ Features

- 🤖 AI Chat (OpenAI & Gemini)
- 🎵 Media Commands (YouTube, TikTok, Instagram)
- 🎮 Fun & Games
- 🎭 Special Modes (Sheng Mode, Goten Resources)
- 🛠️ Utility Tools
- 👁️ Monitoring System
- 🌐 Group Management
- 🎨 Sticker Creation

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- WhatsApp account
- API keys (OpenAI, Gemini)
- PostgreSQL database (optional)

## 🚀 Quick Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/goten-bot.git
cd goten-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp config.env.example config.env
```
Edit `config.env` with your API keys and settings.

4. Start the bot:
```bash
# Development mode
npm run dev

# Production mode with PM2
npm run goten
```

## 📱 Deploy to Heroku

### One-Click Deployment

Click the button below to deploy to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/GOTEN)

### Manual Deployment

1. Create a Heroku account if you don't have one
2. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Login to Heroku:
```bash
heroku login
```

4. Create a new app:
```bash
heroku create your-app-name
```

5. Add required buildpacks:
```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest
```

6. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

7. Configure environment variables:
```bash
# Set required variables
heroku config:set BOT_NAME=GOTEN
heroku config:set OWNER_NUMBER=your_phone_number
heroku config:set SESSION_ID=your_encrypted_session_id

# Set optional variables
heroku config:set NO_PREFIX=yes
heroku config:set PUBLIC_MODE=yes
heroku config:set AI_ENABLED=yes
heroku config:set SHENG_MODE=yes
```

8. Deploy to Heroku:
```bash
git push heroku main
```

9. Start the bot:
```bash
heroku ps:scale web=1
```

### Generating Session ID

Before deploying to Heroku, you need to generate and encrypt a session ID:

1. Follow the instructions in [GOTEN_SESSION_GENERATOR.md](GOTEN_SESSION_GENERATOR.md)
2. Use the encrypted session ID when deploying

## 🤖 Bot Commands

### System Commands
- `clearcache` - Clear bot cache
- `uptime` - Show bot uptime
- `ping` - Check bot latency
- `sleep <time>` - Put bot to sleep
- `restart` - Restart the bot

### Media Commands
- `play <query>` - Play music from YouTube
- `yt <url>` - Download YouTube video
- `tiktok <url>` - Download TikTok video
- `ig <url>` - Download Instagram media

### AI & Tools
- `ai <message>` - Chat with AI
- `gpt <message>` - Use ChatGPT
- `blackboxai <message>` - Use Blackbox AI
- `define <word>` - Get word definition

### Group Management
- `add` - Add member
- `kick` - Kick member
- `promote` - Promote to admin
- `demote` - Demote admin
- `tagall` - Tag all members
- `hidetag` - Hide tag members

### Monitoring Features
- `status on/off` - Toggle status monitoring
- `viewonce on/off` - Toggle view-once monitoring
- `antidelete on/off` - Toggle anti-delete feature

### Special Modes
- `sheng on/off` - Toggle Sheng mode
- `goten download` - Download Goten resources
- `goten list` - List Goten resources
- `goten send image/sound <number>` - Send Goten resource

## 🔧 Configuration

Edit `config.env` to customize:

```env
# Bot Configuration
BOT_NAME="GOTEN"
OWNER_NAME="Your Name"
OWNER_NUMBER="Your Number"
PREFIX=""
NO_PREFIX="yes"

# API Keys
OPENAI_API_KEY="your-openai-key"
GEMINI_API_KEY="your-gemini-key"
```

## 🛠️ Troubleshooting

1. **Session Issues**
   - Delete `Session` folder
   - Restart bot and scan QR code

2. **Database Issues**
   - Check DATABASE_URL in config.env
   - Ensure PostgreSQL is running

3. **API Errors**
   - Verify API keys
   - Check service status

## 📞 Support

- Developer: Derrick (ecnord noxel)
- WhatsApp: +254726498682

## 📝 License

This project is licensed under the MIT License.

## 🙏 Credits

- Original concept by Bera Tech Bot
- Modified and enhanced by Derrick (ecnord noxel) 