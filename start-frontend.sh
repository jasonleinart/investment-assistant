#!/bin/bash

# Start Frontend Script
echo "🚀 Starting Frontend..."

# Get the script directory (works regardless of where script is called from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found at: $FRONTEND_DIR"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo "❌ package.json not found at: $FRONTEND_DIR/package.json"
    exit 1
fi

# Kill any existing frontend processes
echo "🔄 Checking for existing frontend processes..."
pkill -f "vite" 2>/dev/null && echo "   Stopped existing frontend" || echo "   No existing frontend found"

# Start the frontend
echo "✅ Starting frontend from: $FRONTEND_DIR"
cd "$FRONTEND_DIR"
npm run dev

echo "🛑 Frontend stopped" 