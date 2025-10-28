# TwentyFourSeven Time Tracker

A full-stack time tracking application built with React + TypeScript, Redux, Tailwind CSS, NestJS, PostgreSQL, and Prisma.

## Features

- **Web Worker Timer**: Accurate time tracking using Web Workers
- **Dashboard**: Large timer display, donut chart visualization, and goal progress bars
- **6 Fixed Categories**: Work, Personal, Learning, Health, Social, Other
- **Core APIs**:
  - `POST /timer/start` - Start a new timer
  - `POST /timer/stop` - Stop an active timer
  - `GET /gaps/check` - Check for time gaps
  - `POST /takeaways` - Create takeaways
  - `GET /reports/` - Get reports
  - `GET /reports/dashboard` - Get dashboard data
- **Minimal UI**: Clean, mobile-responsive design with distinct category colors

## Tech Stack

### Frontend
- React 18 with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Recharts for data visualization
- Web Workers for timer accuracy

### Backend
- NestJS framework
- PostgreSQL database
- Prisma ORM
- TypeScript

## Database Schema

- **User**: User information
- **Category**: 6 fixed categories (Work, Personal, Learning, Health, Social, Other)
- **Project**: User projects linked to categories
- **TimeEntry**: Time tracking entries with start/end/duration
- **Takeaway**: Daily takeaways and notes
- **Goal**: User goals with progress tracking

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure database
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the server
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
twentyfourseven/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── timer/
│       ├── gaps/
│       ├── takeaways/
│       ├── reports/
│       └── common/
└── frontend/
    ├── public/
    │   └── workers/
    │       └── timer.worker.js
    └── src/
        ├── components/
        │   ├── Dashboard/
        │   ├── Timer/
        │   ├── TimerControls/
        │   ├── DonutChart/
        │   └── GoalProgress/
        ├── store/
        │   └── slices/
        └── types/
```

## API Endpoints

### Timer
- `POST /timer/start` - Start a new timer
- `POST /timer/stop` - Stop an active timer
- `GET /timer/active/:userId` - Get active timer

### Gaps
- `GET /gaps/check?userId={id}&startDate={date}&endDate={date}` - Check for time gaps

### Takeaways
- `POST /takeaways` - Create a new takeaway
- `GET /takeaways?userId={id}` - Get user takeaways

### Reports
- `GET /reports?userId={id}&startDate={date}&endDate={date}` - Get time report
- `GET /reports/dashboard?userId={id}` - Get dashboard data

## License

ISC
