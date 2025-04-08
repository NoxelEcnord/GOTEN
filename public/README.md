# GOTEN Bot Static Assets

This directory contains all the static assets used by the GOTEN Bot web interface and WhatsApp bot.

## Directory Structure

- `/assets/` - All media assets
  - `/assets/images/` - Goten character images
  - `/assets/menu/` - Menu background images
  - `/assets/logos/` - Bot logos and branding
  - `/assets/stickers/` - Sticker images for the bot

## Usage

These assets are served via Render.com and can be used by the bot with the following patterns:

- Menu images: `https://goten-bot.onrender.com/assets/menu/default_menu.jpg`
- Logo: `https://goten-bot.onrender.com/assets/logos/goten_logo.jpg`
- Character images: `https://goten-bot.onrender.com/assets/images/goten_standing.jpg`

## Adding New Assets

When adding new assets:

1. Use the appropriate directory based on the asset type
2. Use descriptive filenames
3. Optimize images for web use
4. Update any references in the bot code if necessary

## Notes

The static site on Render.com serves dual purposes:
1. Hosting the session generation interface
2. Providing CDN-like access to bot assets 