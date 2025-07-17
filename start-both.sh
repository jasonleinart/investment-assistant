#!/bin/bash

# Start Both Services Script
echo "🚀 Starting Complete Investing System..."

# Get the script directory (works regardless of where script is called from)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts seconds"
    return 1
}

# Kill existing processes
echo "🔄 Stopping existing services..."
pkill -f "python.*api_technical" 2>/dev/null && echo "   Backend stopped" || echo "   No backend running"
pkill -f "vite" 2>/dev/null && echo "   Frontend stopped" || echo "   No frontend running"
sleep 2

# Start Backend
echo "🔧 Starting Backend..."
"$SCRIPT_DIR/start-backend.sh" > backend.log 2>&1 &
BACKEND_PID=$!

# Start Frontend  
echo "🎨 Starting Frontend..."
"$SCRIPT_DIR/start-frontend.sh" > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for services to be ready
wait_for_service "http://localhost:8001/health" "Backend API"
BACKEND_READY=$?

wait_for_service "http://localhost:5173" "Frontend"
FRONTEND_READY=$?

echo ""
echo "=== 🎯 SYSTEM STATUS ==="
if [ $BACKEND_READY -eq 0 ]; then
    echo "✅ Backend API: http://localhost:8001"
else
    echo "❌ Backend API: Failed to start"
fi

if [ $FRONTEND_READY -eq 0 ]; then
    echo "✅ Frontend: http://localhost:5173"
else
    echo "❌ Frontend: Failed to start"
fi

echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services: pkill -f 'python.*api_technical'; pkill -f 'vite'"
echo ""

if [ $BACKEND_READY -eq 0 ] && [ $FRONTEND_READY -eq 0 ]; then
    echo "🎉 Complete system is ready!"
    echo "🌐 Open http://localhost:5173 in your browser"
else
    echo "⚠️  Some services failed to start. Check the logs above."
fi 