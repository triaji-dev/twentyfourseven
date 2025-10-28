# Quick Start Guide

## Option 1: Docker (Recommended)

The easiest way to run the application:

```bash
# Clone the repository
git clone https://github.com/triaji-dev/twentyfourseven.git
cd twentyfourseven

# Production mode (optimized builds)
docker-compose up

# OR Development mode (hot reload)
docker-compose -f docker-compose.dev.yml up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

**Note:** On first run, you need to seed the database with categories:
```bash
# After containers are running
docker exec twentyfourseven-backend npm run prisma:seed
```

## Option 2: Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Step 1: Setup Database

```bash
# Install PostgreSQL and create a database
createdb twentyfourseven

# Or use Docker for just the database
docker run -d \
  --name twentyfourseven-db \
  -e POSTGRES_USER=twentyfourseven \
  -e POSTGRES_PASSWORD=twentyfourseven \
  -e POSTGRES_DB=twentyfourseven \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL
# Example: DATABASE_URL="postgresql://twentyfourseven:twentyfourseven@localhost:5432/twentyfourseven?schema=public"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with categories
npm run prisma:seed

# Start the backend server
npm run dev
```

Backend will be running at http://localhost:3001

### Step 3: Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env
# Default REACT_APP_API_URL is http://localhost:3001

# Start the frontend
npm start
```

Frontend will be running at http://localhost:3000

## First Use

1. Open http://localhost:3000 in your browser
2. You'll see the dashboard with a large timer display
3. Select a category (Work, Personal, Learning, Health, Social, or Other)
4. Click "Start Timer" to begin tracking
5. Click "Stop Timer" when done
6. View your time distribution in the donut chart

## Demo User

A demo user is created automatically when seeding:
- Email: demo@example.com
- The application uses a hardcoded user ID in development mode

## Features to Explore

- **Web Worker Timer**: The timer uses a Web Worker for accurate time tracking
- **Dashboard**: See today's and this week's time summary
- **Category Distribution**: Visual donut chart shows how you spend your time
- **Goal Tracking**: Set goals and track progress (goals feature is available in the backend)

## Testing the APIs

You can test the backend APIs using curl or Postman:

```bash
# Get dashboard data
curl http://localhost:3001/reports/dashboard?userId=user-1

# Start a timer
curl -X POST http://localhost:3001/timer/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "categoryId": "category-id-here"
  }'

# Stop a timer
curl -X POST http://localhost:3001/timer/stop \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "entryId": "entry-id-here"
  }'
```

## Troubleshooting

### Frontend won't connect to backend
- Check that the backend is running on port 3001
- Verify REACT_APP_API_URL in frontend/.env

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database credentials

### Build errors
- Delete node_modules and package-lock.json, then run `npm install` again
- Ensure you're using Node.js 20+

## Next Steps

- Customize the application for your needs
- Add authentication
- Deploy to production
- Add more features like reports, analytics, and team collaboration
