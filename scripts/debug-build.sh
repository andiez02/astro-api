#!/bin/bash

# Debug script to check build process
echo "Checking build process..."

# Check if dist exists locally
if [ -d "dist" ]; then
    echo "✅ dist folder exists locally"
    ls -la dist/
    if [ -f "dist/main.js" ]; then
        echo "✅ dist/main.js exists"
    else
        echo "❌ dist/main.js NOT found"
    fi
else
    echo "❌ dist folder does NOT exist locally"
    echo "Running build..."
    npm run build
    if [ -d "dist" ]; then
        echo "✅ Build successful"
        ls -la dist/
    else
        echo "❌ Build failed"
    fi
fi

