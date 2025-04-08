# GOTEN Bot Session Generator

This tool helps you generate an encrypted WhatsApp session ID for your GOTEN Bot deployment on Heroku.

## What This Is

The Session Generator is a web service that:
1. Generates WhatsApp pairing codes
2. Handles the WhatsApp pairing process
3. Creates and encrypts a session ID
4. Sends the encrypted session ID to your WhatsApp
5. Provides instructions for using this ID with Heroku

**IMPORTANT:** This service is *only* for generating session IDs. You will deploy your actual GOTEN Bot on Heroku, not on Render.com.

## How to Use the Session Generator

### Option 1: Using the Public Session Generator

If available, you can use the public session generator:
1. Visit the public pairing service URL (provided by the developer)
2. Navigate to `/render-session` path
3. Follow the on-screen instructions

### Option 2: Host Your Own Generator on Render.com

1. Fork this repository to your GitHub account
2. Log in to your Render.com account
3. Click on "New" and select "Web Service"
4. Connect your GitHub account
5. Select your forked repository
6. Configure the service:
   - **Name**: "goten-session-generator" (or any name you prefer)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node pair.js`
7. Click "Create Web Service"
8. Once deployed, visit your service URL + `/render-session` path

### Using the Session Generator

1. Enter your WhatsApp number with country code (e.g., 1234567890)
2. You'll receive a pairing code on the screen
3. On your WhatsApp, go to **Settings > Linked Devices > Link a Device**
4. Enter the pairing code shown on the website
5. Once paired, you'll receive an encrypted session ID in your WhatsApp direct messages
6. Copy this session ID for your Heroku deployment

## Deploying the Bot on Heroku

1. Create a new app on Heroku
2. Connect your GitHub repository for the main GOTEN Bot
3. Add the following environment variables:
   - `SESSION_ID`: The encrypted session ID you received in WhatsApp
   - `OWNER_NUMBER`: Your WhatsApp number with country code
   - Other required variables for your bot
4. Deploy your app

## Troubleshooting

If you encounter issues:

1. **Pairing code doesn't work**: Make sure you're entering it correctly in WhatsApp and that it hasn't expired
2. **Can't access the session generator**: Check if your Render.com service is running properly
3. **Bot not connecting on Heroku**: Verify your SESSION_ID is correct in the environment variables

## Support

If you need help with your session generation or bot deployment:

- Telegram: t.me/botGOTEN
- WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6 