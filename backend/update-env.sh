#!/bin/bash
# Update DATABASE_URL in .env file to use Supabase pooler connection

ENV_FILE="/Users/rahul/Desktop/Projects/expense-tracker/backend/.env"

# Backup the current .env
cp "$ENV_FILE" "$ENV_FILE.backup" 2>/dev/null || true

# Update DATABASE_URL to use pooler
sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres.aipeqsedcfnhbnuhutnd:qDu7!@mp2cPxSxg@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true\&connection_limit=1"|' "$ENV_FILE"

echo "✅ DATABASE_URL updated to use Supabase pooler connection"
echo "Current DATABASE_URL:"
grep DATABASE_URL "$ENV_FILE" || echo "Could not read DATABASE_URL"

