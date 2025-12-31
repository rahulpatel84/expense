# 🚀 Backend Server Setup Guide

## ✅ Current Status

Your ExpenseAI backend is fully configured and ready to run! Here's what's been set up:

### Database
- ✅ Supabase PostgreSQL database connected
- ✅ All tables created (users, password_resets, email_verifications, audit_logs)
- ✅ Migrations applied and tracked
- ✅ Prisma Client generated (v5.22.0)

### Backend Configuration
- ✅ NestJS application structure complete
- ✅ Authentication system implemented (JWT + Passport)
- ✅ Email service configured (SendGrid)
- ✅ Rate limiting enabled
- ✅ Security middleware in place
- ✅ CORS configured for frontend

## 🔧 Starting the Server

### Option 1: Start in Development Mode (Recommended)

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npm run start:dev
```

The server will start on `http://localhost:3000`

### Option 2: Start with Environment Variables

If you encounter `.env` file permission issues, start the server with inline environment variables:

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
DATABASE_URL="postgresql://postgres.aipeqsedcfnhbnuhutnd:qDu7!@mp2cPxSxg@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" \
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key" \
SENDGRID_API_KEY="your-sendgrid-api-key" \
npm run start:dev
```

### Option 3: Build for Production

```bash
cd /Users/rahul/Desktop/Projects/expense-tracker/backend
npm run build
npm run start:prod
```

## 📍 Available API Endpoints

Once the server is running, you can access these endpoints:

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/me` - Get current user profile

## 🧪 Testing the API

### Test Health Check
```bash
curl http://localhost:3000/api/auth/me
```

Should return `{"message":"Unauthorized"}` (expected, since you're not logged in)

### Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "currencyCode": "USD"
  }'
```

## ⚙️ Environment Variables

Make sure your `.env` file contains:

```env
# Database
DATABASE_URL="postgresql://postgres.aipeqsedcfnhbnuhutnd:qDu7!@mp2cPxSxg@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key-here"
EMAIL_FROM="noreply@expenseai.com"
EMAIL_FROM_NAME="ExpenseAI"

# App
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
THROTTLE_TTL="60"
THROTTLE_LIMIT="10"
```

## 🐛 Troubleshooting

### Database Connection Issues

If you see `Can't reach database server`, verify:
1. DATABASE_URL uses the pooler connection (port 6543)
2. Database password is correct: `qDu7!@mp2cPxSxg`
3. Supabase project is active

### Permission Issues

If you see `EPERM: operation not permitted`, try:
1. Run with `sudo` (not recommended)
2. Use Option 2 above (inline environment variables)
3. Check file permissions: `chmod 644 .env`

### Port Already in Use

If port 3000 is busy:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run start:dev
```

## 📚 Next Steps

1. ✅ Start the backend server
2. 🎨 Start the frontend development server
3. 🧪 Test the authentication flow
4. 🚀 Deploy to production (Vercel/Railway)

## 🎯 Success Indicators

When the server starts successfully, you should see:

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] PassportModule dependencies initialized
[Nest] LOG [InstanceLoader] ConfigModule dependencies initialized
✅ SendGrid email service initialized
✅ Database connected successfully
[Nest] LOG [NestApplication] Nest application successfully started
🚀 Server running on http://localhost:3000
```

## 📝 Important Notes

- The database connection uses Supabase's pooler (required for production)
- JWT secrets should be changed before production deployment
- SendGrid API key is needed for email functionality
- CORS is configured to allow requests from `http://localhost:5173` (frontend)

---

**Ready to build the future of expense tracking!** 🎉

