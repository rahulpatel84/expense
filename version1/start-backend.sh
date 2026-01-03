#!/bin/bash

# Start Backend Server Script
# This script helps you start the backend server easily

echo "🚀 Starting ExpenseAI Backend Server..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📝 Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file"
        echo "⚠️  Please update DATABASE_URL in .env file"
    else
        echo "❌ .env.example not found!"
    fi
    echo ""
fi

# Start the server
echo "🎯 Starting backend server on port 3001..."
echo "📡 Server will be available at: http://localhost:3001"
echo "📚 API will be available at: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run start:dev

