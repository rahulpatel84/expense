#!/bin/bash

echo "🚀 Setting up Local PostgreSQL for ExpenseAI"
echo "============================================"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed"
    echo "📥 Install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "Step 1: Installing PostgreSQL..."
brew install postgresql@15

echo ""
echo "Step 2: Starting PostgreSQL service..."
brew services start postgresql@15

echo ""
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

echo ""
echo "Step 3: Creating database..."
createdb expenseai_dev

echo ""
echo "✅ Database 'expenseai_dev' created!"

echo ""
echo "Step 4: Updating .env file..."
ENV_FILE="/Users/rahul/Desktop/Projects/expense-tracker/backend/.env"

# Backup current .env
cp "$ENV_FILE" "$ENV_FILE.backup-local-$(date +%Y%m%d-%H%M%S)"

# Update DATABASE_URL to use local PostgreSQL
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://localhost:5432/expenseai_dev"|' "$ENV_FILE"
else
    sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://localhost:5432/expenseai_dev"|' "$ENV_FILE"
fi

echo "✅ .env updated with local database connection"

echo ""
echo "Step 5: Running database migrations..."
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npx prisma migrate deploy

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║   ✅ Local PostgreSQL Setup Complete!                         ║"
echo "║                                                                ║"
echo "║   📊 Database: expenseai_dev                                   ║"
echo "║   🔗 Connection: postgresql://localhost:5432/expenseai_dev     ║"
echo "║   📍 Server: http://localhost:3000                             ║"
echo "║                                                                ║"
echo "║   Your server will auto-restart and connect to local DB!      ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 You can now test your authentication system!"
echo ""

