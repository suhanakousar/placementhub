#!/bin/bash

# Start the Placement Hub application
echo "Starting Placement Hub..."

# Install server dependencies (production only)
cd server
npm install --omit=dev

# Start the server
npm start &

# Serve the client build
cd ../client-build
npx serve -s . -l 3000 &

echo "Placement Hub is running!"
echo "Server: http://localhost:5000"
echo "Client: http://localhost:3000"
