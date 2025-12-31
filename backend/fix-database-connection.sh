#!/bin/bash

echo "🔧 ExpenseAI Database Connection Fixer"
echo "======================================"
echo ""

ENV_FILE="/Users/rahul/Desktop/Projects/expense-tracker/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo "Current DATABASE_URL:"
grep "^DATABASE_URL" "$ENV_FILE" || echo "Not found"
echo ""

echo "Choose a fix option:"
echo ""
echo "1) Try Supabase Direct Connection (port 5432)"
echo "2) Use Local PostgreSQL (you need to install it first)"
echo "3) Show manual instructions"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "✨ Applying Supabase Direct Connection fix..."
        cp "$ENV_FILE" "$ENV_FILE.backup-$(date +%Y%m%d-%H%M%S)"
        
        # Update DATABASE_URL to use direct connection
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:qDu7!@mp2cPxSxg@db.aipeqsedcfnhbnuhutnd.supabase.co:5432/postgres?sslmode=require"|' "$ENV_FILE"
        else
            # Linux
            sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:qDu7!@mp2cPxSxg@db.aipeqsedcfnhbnuhutnd.supabase.co:5432/postgres?sslmode=require"|' "$ENV_FILE"
        fi
        
        echo "✅ DATABASE_URL updated to use direct connection (port 5432)"
        echo ""
        echo "New DATABASE_URL:"
        grep "^DATABASE_URL" "$ENV_FILE"
        echo ""
        echo "🔄 Your server should auto-restart. Check the logs!"
        echo "If it doesn't work, see DATABASE-FIX-GUIDE.md for other options."
        ;;
        
    2)
        echo ""
        echo "📝 To use Local PostgreSQL:"
        echo ""
        echo "Step 1: Install PostgreSQL"
        echo "  brew install postgresql@15"
        echo "  brew services start postgresql@15"
        echo ""
        echo "Step 2: Create database"
        echo "  createdb expenseai_dev"
        echo ""
        echo "Step 3: Update DATABASE_URL in .env to:"
        echo '  DATABASE_URL="postgresql://localhost:5432/expenseai_dev"'
        echo ""
        echo "Step 4: Run migrations"
        echo "  cd backend && npx prisma migrate deploy"
        echo ""
        read -p "Press Enter to continue..."
        ;;
        
    3)
        echo ""
        echo "📖 Opening DATABASE-FIX-GUIDE.md for detailed instructions..."
        if command -v open &> /dev/null; then
            open "/Users/rahul/Desktop/Projects/expense-tracker/DATABASE-FIX-GUIDE.md"
        else
            echo "Please open: /Users/rahul/Desktop/Projects/expense-tracker/DATABASE-FIX-GUIDE.md"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Done!"

