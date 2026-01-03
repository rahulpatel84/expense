# ExpenseAI - Expense Tracker SaaS

A full-stack expense tracking application with authentication, built with modern technologies and ready for production deployment.

## Features

- **Complete Authentication System**
  - User signup and login with JWT tokens
  - Secure password hashing with bcrypt
  - Protected routes and session management
  - Logout functionality

- **Modern SaaS UI**
  - Beautiful landing page with hero section
  - Responsive design (mobile, tablet, desktop)
  - Professional dashboard layout
  - Clean and intuitive user experience

- **Production Ready**
  - PostgreSQL database with Prisma ORM
  - NestJS backend with TypeScript
  - React frontend with Vite
  - Environment-based configuration
  - Health check endpoints
  - CORS configured for security

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Prisma** - Modern ORM with type safety
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Modern icon library

### Deployment
- **Railway** - Backend + PostgreSQL hosting
- **Vercel** - Frontend hosting
- **GitHub** - Version control

## Project Structure

```
version1/
├── backend/               # NestJS backend
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # Users module
│   │   ├── app.controller.ts
│   │   └── main.ts       # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── .env              # Environment variables
│   └── package.json
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.jsx       # Main app component
│   ├── public/           # Static assets
│   └── package.json
│
├── DEPLOYMENT-GUIDE.md   # Detailed deployment guide
├── QUICKSTART-DEPLOY.md  # 15-minute quick start
└── DEPLOY-CHECKLIST.md   # Step-by-step checklist
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed and running
- Git installed

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd expense-tracker/version1
```

### 2. Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create database
createdb expense_tracker_v1

# Run migrations
npx prisma migrate dev

# Start backend server
npm run start:dev
```

Backend runs at: `http://localhost:3001`

### 3. Setup Frontend

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Test Locally

1. Open `http://localhost:5173`
2. Click "Sign Up" and create an account
3. You'll be redirected to the dashboard
4. Test logout and login

## Deployment

Choose your deployment guide:

1. **[QUICKSTART-DEPLOY.md](./QUICKSTART-DEPLOY.md)** - Deploy in 15 minutes
2. **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Comprehensive guide with explanations
3. **[DEPLOY-CHECKLIST.md](./DEPLOY-CHECKLIST.md)** - Step-by-step checklist format

All guides cover:
- Deploying backend + PostgreSQL to Railway (free tier)
- Deploying frontend to Vercel (free tier)
- Environment variable configuration
- CORS setup for production
- Testing your live app

## API Endpoints

### Public Endpoints
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login and get JWT token
- `GET /health` - Health check endpoint

### Protected Endpoints (require JWT token)
- `GET /users/profile` - Get current user profile
- `GET /auth/check` - Verify authentication status

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker_v1"
JWT_SECRET="your-secure-secret-key"
JWT_EXPIRES_IN="15m"
NODE_ENV="development"
PORT=3001
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-app.railway.app
```

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- CORS protection for cross-origin requests
- Environment-based configuration
- Protected API routes
- Secure HTTP-only cookie support (ready)

## Current Status

### Completed
- ✅ Authentication system (signup, login, logout)
- ✅ User management with PostgreSQL
- ✅ Modern SaaS landing page
- ✅ Responsive dashboard UI
- ✅ Protected routes
- ✅ Production-ready backend
- ✅ Deployment documentation

### Planned Features
- [ ] Expense creation and management
- [ ] Expense categories
- [ ] Budget tracking
- [ ] Analytics and charts
- [ ] Receipt uploads
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Password reset via email

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Run migrations: `npx prisma migrate dev`

### Frontend can't connect to backend
- Check backend is running on port 3001
- Verify CORS configuration in `backend/src/main.ts`
- Check browser console for errors

### Database errors
- Ensure database exists: `createdb expense_tracker_v1`
- Reset database: `npx prisma migrate reset`
- Generate Prisma client: `npx prisma generate`

## Contributing

This is a learning project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Use it as a template for your own projects

## License

MIT License - feel free to use this project for learning and commercial purposes.

## Credits

Built with:
- [NestJS](https://nestjs.com/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/)

---

**Ready to deploy?** Start with [QUICKSTART-DEPLOY.md](./QUICKSTART-DEPLOY.md)!
