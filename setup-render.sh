#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  GOTEN Bot Session Generator Setup for Render  ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

echo -e "${YELLOW}This script will help you prepare your repository for Render.com deployment.${NC}"
echo -e "${YELLOW}It will create necessary directories and files for both:${NC}"
echo -e "${YELLOW}1. Static Site (frontend UI)${NC}"
echo -e "${YELLOW}2. Web Service (backend API)${NC}"
echo ""

# Make sure the public directory exists
if [ ! -d "public" ]; then
    echo -e "${GREEN}Creating public directory for static files...${NC}"
    mkdir -p public
fi

# Make sure the temp directory exists
if [ ! -d "temp" ]; then
    echo -e "${GREEN}Creating temp directory for session files...${NC}"
    mkdir -p temp
fi

# Make sure the sessions directory exists
if [ ! -d "sessions" ]; then
    echo -e "${GREEN}Creating sessions directory...${NC}"
    mkdir -p sessions
fi

# Check if index.html exists in public
if [ ! -f "public/index.html" ]; then
    echo -e "${GREEN}Creating index.html in public directory...${NC}"
    cp public/session-generator.html public/index.html 2>/dev/null || echo -e "${RED}Failed to copy session-generator.html to index.html${NC}"
fi

# Verify that required files exist
echo -e "${GREEN}Checking for required files...${NC}"
required_files=("pair.js" "public/index.html" "public/session-generator.html")
missing_files=0

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Missing required file: $file${NC}"
        missing_files=$((missing_files+1))
    else
        echo -e "${GREEN}✓ Found $file${NC}"
    fi
done

if [ $missing_files -gt 0 ]; then
    echo -e "${RED}Please create the missing files before deploying to Render.com${NC}"
else
    echo -e "${GREEN}All required files are present!${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating sample .env file...${NC}"
    echo "STATIC_SITE_URL=https://your-static-site.onrender.com" > .env
    echo "NODE_ENV=production" >> .env
    echo -e "${YELLOW}Please update the .env file with your actual static site URL${NC}"
fi

echo ""
echo -e "${BLUE}======================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}======================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. ${GREEN}Deploy the Static Site on Render.com:${NC}"
echo -e "   - Create a new Static Site on Render.com"
echo -e "   - Connect your GitHub repository"
echo -e "   - Set Publish Directory to: ${BLUE}public${NC}"
echo ""
echo -e "2. ${GREEN}Deploy the Backend API on Render.com:${NC}"
echo -e "   - Create a new Web Service on Render.com"
echo -e "   - Connect your GitHub repository"
echo -e "   - Set Build Command to: ${BLUE}npm install${NC}"
echo -e "   - Set Start Command to: ${BLUE}node pair.js${NC}"
echo -e "   - Add Environment Variable: ${BLUE}STATIC_SITE_URL=<your-static-site-url>${NC}"
echo ""
echo -e "${YELLOW}See RENDER_STATIC_DEPLOY.md for detailed instructions.${NC}"
echo "" 