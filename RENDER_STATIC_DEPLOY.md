# Deploying GOTEN Session Generator on Render.com Static Sites

This guide explains how to use Render.com's **Static Sites** feature to host the frontend of your GOTEN Session Generator while deploying the backend API separately.

## Advantages of Using Static Sites

1. **Free tier available** - Render.com offers a free tier for static sites
2. **Faster loading** - Static sites load faster than full web services
3. **Global CDN** - Content is distributed globally for better performance
4. **Simpler deployment** - Easy to set up and maintain

## Setup Overview

We'll use a hybrid approach:
1. Deploy the static frontend files on Render.com Static Sites
2. Deploy the backend API as a separate Web Service

## Step 1: Create a Static Site

1. Log in to your Render.com dashboard
2. Click on "New" and select "Static Site"
3. Connect your GitHub repository
4. Configure the static site:
   - **Name**: "goten-session-ui" (or any name you prefer)
   - **Branch**: `main` (or your preferred branch)
   - **Build Command**: Leave empty (or use a build command if you have a build process)
   - **Publish Directory**: `public` (this is where your static HTML/CSS/JS files are)

## Step 2: Configure API Integration

Since static sites are just HTML/CSS/JS files without server-side code, we need to handle the API integration:

### Option 1: Configure API URL in Frontend

In your HTML/JS files, update the API endpoint URLs to point to your deployed backend service:

```javascript
// Change this in your frontend JavaScript files
const API_URL = 'https://your-backend-api.onrender.com';

// Example usage
async function generatePairingCode(phone) {
    const response = await fetch(`${API_URL}/render-pair`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
    });
    return await response.json();
}
```

### Option 2: Use Environment Variables

If you have a build process, you can use environment variables in Render.com:

1. In your static site settings, add an environment variable:
   - Key: `REACT_APP_API_URL` (or similar)
   - Value: `https://your-backend-api.onrender.com`

2. In your code, use this variable:
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL;
   ```

## Step 3: Deploy the Backend API

Deploy the backend API as a separate Web Service:

1. Create a new Web Service in Render.com
2. Use the same repository but with a different configuration:
   - **Name**: "goten-session-api"
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node pair.js`

## Step 4: Configure CORS

Since your frontend and backend are on different domains, you need to configure CORS in your backend:

```javascript
// Add this to your pair.js file
const cors = require('cors');

// Enable CORS for your static site
app.use(cors({
    origin: 'https://your-static-site.onrender.com'
}));
```

## Step 5: Test Your Deployment

1. Visit your static site URL
2. Try generating a session ID
3. Make sure API calls are working properly

## Benefits for Your Users

- Faster page loads
- Better reliability
- The same great session generation functionality

## Maintenance

To update your static site:
1. Push changes to your GitHub repository
2. Render.com will automatically redeploy the site

For the backend:
1. Push changes to your GitHub repository
2. Render.com will rebuild and redeploy the API service

## Support

If you need assistance with your static site deployment:
- Telegram: t.me/botGOTEN
- WhatsApp Group: https://chat.whatsapp.com/IulubL26uYyJICyAj9DWg6 