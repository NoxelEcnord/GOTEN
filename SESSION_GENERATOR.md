# GOTEN Session Generator

This tool helps you generate a WhatsApp session ID for your GOTEN Bot using the modern pairing code method.

## Features
- Uses WhatsApp's official pairing code system (no QR code scanning needed)
- Automatically saves session credentials
- Cleans up old session files
- Simple to use

## Prerequisites
- Node.js v16 or higher
- npm (Node Package Manager)

## Installation

1. Install the required dependencies:
```bash
npm install
```

## Usage

1. Run the session generator with your phone number:
```bash
npm run session -- +1234567890
```
Replace `+1234567890` with your actual phone number including country code.

2. You will receive a pairing code in the terminal. Enter this code in your WhatsApp mobile app:
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices
   - Tap on "Link a Device"
   - When prompted, enter the pairing code shown in the terminal

3. Once connected, the session generator will:
   - Save your session credentials in the `goten_session` directory
   - Create a `session_id.txt` file with your session ID
   - Display the session ID in the terminal

## Output Files
- `goten_session/creds.json`: Contains your full session credentials
- `session_id.txt`: Contains just your session ID for easy access

## Troubleshooting

If you encounter any issues:

1. Make sure you have a stable internet connection
2. Verify that your phone number is correct and includes the country code
3. Check that WhatsApp is properly installed and working on your phone
4. Try deleting the `goten_session` directory and running the generator again

## Security Notes
- Keep your session files secure and never share them
- The session generator automatically cleans up old session files
- Each session is valid until you manually log out from WhatsApp 