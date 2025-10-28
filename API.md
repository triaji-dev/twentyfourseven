# API Documentation

Base URL: `http://localhost:3001`

## Authentication

Currently, the API does not require authentication. In production, you should add authentication middleware.

## Timer Endpoints

### Start Timer

Start a new time tracking session.

**Endpoint:** `POST /timer/start`

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "categoryId": "string (UUID)",
  "projectId": "string (UUID, optional)",
  "notes": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-1",
  "categoryId": "cat-1",
  "projectId": null,
  "startTime": "2025-10-28T22:00:00.000Z",
  "endTime": null,
  "duration": null,
  "notes": null,
  "category": {
    "id": "cat-1",
    "name": "Work",
    "color": "#3B82F6"
  },
  "project": null
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Server error (e.g., already active timer)

### Stop Timer

Stop the currently active timer.

**Endpoint:** `POST /timer/stop`

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "entryId": "string (UUID)",
  "notes": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-1",
  "categoryId": "cat-1",
  "projectId": null,
  "startTime": "2025-10-28T22:00:00.000Z",
  "endTime": "2025-10-28T23:30:00.000Z",
  "duration": 5400,
  "notes": "Completed task",
  "category": {
    "id": "cat-1",
    "name": "Work",
    "color": "#3B82F6"
  },
  "project": null
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Active timer not found
- `500 Internal Server Error` - Server error

### Get Active Timer

Get the currently active timer for a user.

**Endpoint:** `GET /timer/active/:userId`

**Parameters:**
- `userId` (path) - User ID

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-1",
  "categoryId": "cat-1",
  "startTime": "2025-10-28T22:00:00.000Z",
  "endTime": null,
  "duration": null,
  "category": {
    "id": "cat-1",
    "name": "Work",
    "color": "#3B82F6"
  },
  "project": null
}
```

If no active timer: `null`

## Reports Endpoints

### Get Report

Get time tracking report for a specific date range.

**Endpoint:** `GET /reports`

**Query Parameters:**
- `userId` (required) - User ID
- `startDate` (required) - Start date (ISO 8601)
- `endDate` (required) - End date (ISO 8601)

**Example:**
```
GET /reports?userId=user-1&startDate=2025-10-21T00:00:00Z&endDate=2025-10-28T23:59:59Z
```

**Response:** `200 OK`
```json
{
  "totalDuration": 86400,
  "totalHours": 24.0,
  "categoryData": [
    {
      "categoryId": "cat-1",
      "categoryName": "Work",
      "color": "#3B82F6",
      "totalDuration": 28800,
      "count": 5,
      "percentage": 33.33
    },
    {
      "categoryId": "cat-2",
      "categoryName": "Personal",
      "color": "#10B981",
      "totalDuration": 14400,
      "count": 3,
      "percentage": 16.67
    }
  ],
  "entryCount": 12,
  "goals": [],
  "startDate": "2025-10-21T00:00:00.000Z",
  "endDate": "2025-10-28T23:59:59.000Z"
}
```

### Get Dashboard Data

Get aggregated dashboard data including today's and this week's summaries.

**Endpoint:** `GET /reports/dashboard`

**Query Parameters:**
- `userId` (required) - User ID

**Example:**
```
GET /reports/dashboard?userId=user-1
```

**Response:** `200 OK`
```json
{
  "today": {
    "totalDuration": 14400,
    "totalHours": 4.0,
    "categoryData": [
      {
        "categoryId": "cat-1",
        "categoryName": "Work",
        "color": "#3B82F6",
        "totalDuration": 10800,
        "count": 2,
        "percentage": 75.0
      },
      {
        "categoryId": "cat-3",
        "categoryName": "Learning",
        "color": "#8B5CF6",
        "totalDuration": 3600,
        "count": 1,
        "percentage": 25.0
      }
    ],
    "entryCount": 3,
    "goals": []
  },
  "week": {
    "totalDuration": 86400,
    "totalHours": 24.0,
    "categoryData": [
      {
        "categoryId": "cat-1",
        "categoryName": "Work",
        "color": "#3B82F6",
        "totalDuration": 43200,
        "count": 8,
        "percentage": 50.0
      }
    ],
    "entryCount": 15
  },
  "activeTimer": null
}
```

## Gaps Endpoints

### Check Time Gaps

Check for gaps in time tracking between entries.

**Endpoint:** `GET /gaps/check`

**Query Parameters:**
- `userId` (required) - User ID
- `startDate` (required) - Start date (ISO 8601)
- `endDate` (required) - End date (ISO 8601)

**Example:**
```
GET /gaps/check?userId=user-1&startDate=2025-10-28T00:00:00Z&endDate=2025-10-28T23:59:59Z
```

**Response:** `200 OK`
```json
{
  "gaps": [
    {
      "start": "2025-10-28T12:00:00.000Z",
      "end": "2025-10-28T13:30:00.000Z",
      "duration": 5400
    },
    {
      "start": "2025-10-28T17:00:00.000Z",
      "end": "2025-10-28T18:00:00.000Z",
      "duration": 3600
    }
  ],
  "totalGaps": 2,
  "totalGapTime": 9000
}
```

**Note:** Gaps are only reported if they are longer than 5 minutes (300 seconds).

## Takeaways Endpoints

### Create Takeaway

Create a new takeaway/note.

**Endpoint:** `POST /takeaways`

**Request Body:**
```json
{
  "userId": "string (UUID)",
  "content": "string",
  "date": "string (ISO 8601, optional)"
}
```

**Example:**
```json
{
  "userId": "user-1",
  "content": "Learned how to optimize database queries",
  "date": "2025-10-28T00:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-1",
  "content": "Learned how to optimize database queries",
  "date": "2025-10-28T00:00:00.000Z",
  "createdAt": "2025-10-28T22:00:00.000Z",
  "updatedAt": "2025-10-28T22:00:00.000Z"
}
```

### Get Takeaways

Get takeaways for a user, optionally filtered by date range.

**Endpoint:** `GET /takeaways`

**Query Parameters:**
- `userId` (required) - User ID
- `startDate` (optional) - Start date (ISO 8601)
- `endDate` (optional) - End date (ISO 8601)

**Example:**
```
GET /takeaways?userId=user-1&startDate=2025-10-21T00:00:00Z&endDate=2025-10-28T23:59:59Z
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-1",
    "content": "Learned how to optimize database queries",
    "date": "2025-10-28T00:00:00.000Z",
    "createdAt": "2025-10-28T22:00:00.000Z",
    "updatedAt": "2025-10-28T22:00:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "user-1",
    "content": "Completed React tutorial",
    "date": "2025-10-27T00:00:00.000Z",
    "createdAt": "2025-10-27T20:00:00.000Z",
    "updatedAt": "2025-10-27T20:00:00.000Z"
  }
]
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["field must be a UUID", "field should not be empty"],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Categories

The system has 6 fixed categories that are seeded on initial setup:

1. **Work** - `#3B82F6` (Blue)
2. **Personal** - `#10B981` (Green)
3. **Learning** - `#8B5CF6` (Purple)
4. **Health** - `#EF4444` (Red)
5. **Social** - `#F59E0B` (Amber)
6. **Other** - `#6B7280` (Gray)

## Data Types

### UUID
All IDs are UUIDs in the format: `550e8400-e29b-41d4-a716-446655440000`

### ISO 8601 Date
Dates are in ISO 8601 format: `2025-10-28T22:00:00.000Z`

### Duration
Duration is measured in seconds (integer).

## Rate Limiting

Currently, there is no rate limiting. In production, implement rate limiting to prevent abuse.

## CORS

CORS is enabled for the frontend URL (default: `http://localhost:3000`). Configure via `FRONTEND_URL` environment variable.

## Examples Using cURL

### Start Timer
```bash
curl -X POST http://localhost:3001/timer/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "categoryId": "cat-1"
  }'
```

### Stop Timer
```bash
curl -X POST http://localhost:3001/timer/stop \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "entryId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Get Dashboard
```bash
curl http://localhost:3001/reports/dashboard?userId=user-1
```

### Create Takeaway
```bash
curl -X POST http://localhost:3001/takeaways \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "content": "Learned something new today"
  }'
```
