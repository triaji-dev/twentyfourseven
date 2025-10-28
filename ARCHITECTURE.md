# Architecture Documentation

## Overview

TwentyFourSeven is a full-stack time tracking application with a clean separation between frontend and backend.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │  Dashboard │  │  Timer   │  │  Web Worker     │ │
│  │            │  │          │  │  (Accurate      │ │
│  │  - Stats   │  │ - Start  │  │   Ticking)      │ │
│  │  - Chart   │  │ - Stop   │  └─────────────────┘ │
│  │  - Goals   │  │ - Display│                       │
│  └────────────┘  └──────────┘                       │
│         │              │                             │
│         └──────────────┴────────────────┐            │
│                    Redux Store          │            │
│                    (State Management)   │            │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST API
                         │
┌────────────────────────┴────────────────────────────┐
│                Backend (NestJS)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Timer   │  │  Reports │  │  Gaps/Takeaways  │  │
│  │  Module  │  │  Module  │  │  Modules         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│         │              │              │              │
│         └──────────────┴──────────────┘              │
│                   Prisma ORM                         │
└────────────────────────┬────────────────────────────┘
                         │
                         │
┌────────────────────────┴────────────────────────────┐
│              PostgreSQL Database                     │
│  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ User │  │ Category │  │TimeEntry │  │ Goal   │  │
│  └──────┘  └──────────┘  └──────────┘  └────────┘  │
│  ┌─────────┐  ┌──────────┐                          │
│  │ Project │  │ Takeaway │                          │
│  └─────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **Tailwind CSS**: Styling
- **Recharts**: Data visualization
- **Web Workers**: Background timer

### Component Structure

```
src/
├── components/
│   ├── Dashboard/       # Main dashboard container
│   ├── Timer/           # Timer display with Web Worker
│   ├── TimerControls/   # Start/Stop controls + category selection
│   ├── DonutChart/      # Recharts donut chart for time distribution
│   └── GoalProgress/    # Goal progress bars
├── store/
│   ├── slices/
│   │   ├── timerSlice.ts      # Timer state and actions
│   │   └── dashboardSlice.ts  # Dashboard data state
│   └── index.ts         # Redux store configuration
├── types/               # TypeScript interfaces
└── utils/               # Utility functions
```

### State Management

#### Timer Slice
- Active timer state
- Running status
- Elapsed seconds (updated by Web Worker)
- Loading and error states

#### Dashboard Slice
- Today's summary
- Week's summary
- Category distribution data
- Goal progress data

### Web Worker Timer

The timer uses a Web Worker for accuracy:

```javascript
// Worker sends tick every second
setInterval(() => {
  self.postMessage({ type: 'tick' });
}, 1000);

// React component receives ticks and updates Redux
worker.addEventListener('message', (e) => {
  if (e.data.type === 'tick') {
    dispatch(tick());
  }
});
```

## Backend Architecture

### Technology Stack
- **NestJS**: Backend framework
- **TypeScript**: Type safety
- **Prisma**: ORM
- **PostgreSQL**: Database
- **Class Validator**: DTO validation

### Module Structure

```
src/
├── timer/
│   ├── dto/              # Data Transfer Objects
│   ├── timer.controller.ts
│   ├── timer.service.ts
│   └── timer.module.ts
├── gaps/
│   ├── gaps.controller.ts
│   ├── gaps.service.ts
│   └── gaps.module.ts
├── takeaways/
│   ├── dto/
│   ├── takeaways.controller.ts
│   ├── takeaways.service.ts
│   └── takeaways.module.ts
├── reports/
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.module.ts
└── common/
    └── prisma.service.ts  # Prisma client
```

### API Endpoints

#### Timer Module
- `POST /timer/start` - Start a new time entry
- `POST /timer/stop` - Stop active time entry
- `GET /timer/active/:userId` - Get user's active timer

#### Reports Module
- `GET /reports` - Get time report for date range
- `GET /reports/dashboard` - Get dashboard summary data

#### Gaps Module
- `GET /gaps/check` - Check for time gaps between entries

#### Takeaways Module
- `POST /takeaways` - Create a new takeaway
- `GET /takeaways` - Get user's takeaways

## Database Schema

### Core Tables

#### User
- Primary user information
- One-to-many: Projects, TimeEntries, Takeaways, Goals

#### Category (6 fixed entries)
1. Work (#3B82F6 - Blue)
2. Personal (#10B981 - Green)
3. Learning (#8B5CF6 - Purple)
4. Health (#EF4444 - Red)
5. Social (#F59E0B - Amber)
6. Other (#6B7280 - Gray)

#### Project
- User-created projects
- Linked to a category
- Many time entries

#### TimeEntry
- Core time tracking record
- Has start time, end time, duration (in seconds)
- Linked to user, category, and optionally project
- Indexed by userId+startTime for fast queries

#### Takeaway
- Daily notes and learnings
- Linked to user
- Indexed by userId+date

#### Goal
- User goals with target hours
- Progress tracking
- Optional deadline

## Data Flow

### Starting a Timer

1. User selects category in TimerControls
2. User clicks "Start Timer"
3. Redux action dispatched: `startTimer()`
4. API call: `POST /timer/start`
5. Backend creates TimeEntry with startTime
6. Backend returns new TimeEntry
7. Redux updates state: activeTimer, isRunning
8. Web Worker starts ticking
9. Timer display updates every second

### Stopping a Timer

1. User clicks "Stop Timer"
2. Redux action: `stopTimer()`
3. API call: `POST /timer/stop`
4. Backend calculates duration
5. Backend updates TimeEntry with endTime and duration
6. Redux resets timer state
7. Web Worker stops
8. Dashboard refreshes to show new data

### Dashboard Data Flow

1. Dashboard component mounts
2. Redux action: `fetchDashboard()`
3. API call: `GET /reports/dashboard`
4. Backend aggregates:
   - Today's time entries
   - Week's time entries
   - Category breakdowns
   - Active timer
5. Data returned to frontend
6. Redux stores dashboard data
7. Components render charts and stats

## Design Principles

### Minimal UI
- Clean, uncluttered interface
- Focus on essential information
- Clear visual hierarchy

### Category Colors
- Distinct, accessible colors for each category
- Consistent throughout the application
- Used in timer display, charts, and controls

### Mobile Responsive
- Tailwind's responsive classes
- Grid layouts that adapt to screen size
- Touch-friendly controls

## Performance Considerations

### Web Worker Timer
- Prevents main thread blocking
- Maintains accuracy even under load
- Clean separation of concerns

### Database Indexes
- TimeEntry indexed by userId and startTime
- Efficient queries for reports and gaps

### Redux State
- Normalized data structure
- Minimal re-renders
- Optimistic updates where appropriate

## Security Considerations

### Current Implementation
- Basic validation on DTOs
- CORS enabled for frontend
- Input sanitization via class-validator

### Production Recommendations
- Add authentication (JWT, OAuth)
- Implement authorization (user can only access their data)
- Add rate limiting
- Use HTTPS
- Sanitize database queries (Prisma handles this)
- Add CSRF protection
- Implement proper session management

## Scalability Considerations

### Current Setup
- Single instance of frontend and backend
- Single PostgreSQL database

### Scaling Options
1. **Horizontal scaling**: Multiple backend instances behind load balancer
2. **Database replication**: Read replicas for reports
3. **Caching**: Redis for dashboard data
4. **CDN**: Static frontend assets
5. **Microservices**: Split modules into separate services

## Future Enhancements

1. **Authentication & Multi-user**
   - User registration and login
   - Team workspaces
   - Role-based access control

2. **Advanced Reporting**
   - Weekly/monthly reports
   - Export to CSV/PDF
   - Custom date ranges
   - Comparison views

3. **Mobile Apps**
   - React Native mobile app
   - Offline support
   - Push notifications

4. **Integrations**
   - Calendar sync (Google Calendar, Outlook)
   - Project management tools (Jira, Trello)
   - Slack notifications

5. **AI Features**
   - Smart category suggestions
   - Time optimization recommendations
   - Automated takeaway generation
