#!/bin/bash

# Start Backend API Script
echo "🚀 Starting Backend API..."

# Get the script directory (works regardless of where script is called from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at: $BACKEND_DIR"
    exit 1
fi

# Check if API file exists
if [ ! -f "$BACKEND_DIR/api_technical.py" ]; then
    echo "❌ API file not found at: $BACKEND_DIR/api_technical.py"
    exit 1
fi

# Kill any existing backend processes
echo "🔄 Checking for existing backend processes..."
pkill -f "python.*api_technical" 2>/dev/null && echo "   Stopped existing backend" || echo "   No existing backend found"

# Start the backend
echo "✅ Starting backend from: $BACKEND_DIR"
cd "$BACKEND_DIR"
python api_technical.py

echo "�� Backend stopped" 