#!/bin/bash

# Script to generate APK from local build without deployment
# Usage: ./generate-apk-local.sh

echo "🚀 Generating APK from Local Build"
echo "=================================="

# Check if we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Error: 'client' directory not found. Run this from project root."
    exit 1
fi

# Step 1: Build the React app
echo ""
echo "📦 Step 1: Building React app..."
cd client
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete!"

# Step 2: Check if ngrok is available
echo ""
echo "🌐 Step 2: Setting up HTTPS tunnel..."

if command -v ngrok &> /dev/null; then
    echo "✅ ngrok found"
    echo ""
    echo "Starting local server and ngrok tunnel..."
    echo ""
    echo "📝 Instructions:"
    echo "1. A local server will start on port 3000"
    echo "2. ngrok will create a public HTTPS URL"
    echo "3. Copy the HTTPS URL from ngrok output"
    echo "4. Go to https://pwa-builder.com"
    echo "5. Enter the ngrok URL and generate APK"
    echo ""
    echo "Press Ctrl+C to stop the servers when done"
    echo ""
    
    # Start serve in background
    npx serve -s build -l 3000 &
    SERVE_PID=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Start ngrok
    ngrok http 3000
    
    # Cleanup on exit
    kill $SERVE_PID 2>/dev/null
else
    echo "⚠️  ngrok not found. Installing..."
    npm install -g ngrok
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Could not install ngrok automatically."
        echo ""
        echo "📝 Manual setup:"
        echo "1. Install ngrok: https://ngrok.com/download"
        echo "2. Or run: npm install -g ngrok"
        echo "3. Then run this script again"
        echo ""
        echo "Alternative: Use localhost with PWA Builder"
        echo "1. Run: npm run serve"
        echo "2. Go to: https://pwa-builder.com"
        echo "3. Enter: http://localhost:3000"
        exit 1
    fi
    
    echo "✅ ngrok installed! Run this script again."
fi

