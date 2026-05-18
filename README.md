# Voyageur — AI Travel Planner Backend

Node.js + Express REST API that powers the Voyageur travel planning app. Generates day-by-day itineraries using Groq LLaMA LLMs, enriched with live weather forecasts, hotel recommendations, activity booking links, and real-time budget tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript |
| Framework | Express 4 |
| Database | MongoDB (Mongoose ODM) |
| LLM | Groq API — LLaMA 3.3-70b (primary), LLaMA 3.1-8b (fallback) |
| LLM Orchestration | LangChain (`@langchain/groq`) |
| Weather | OpenWeatherMap 5-day forecast API |
| Auth | JWT (15 min access + 7 day refresh tokens, bcrypt) |
| Validation | Zod (env vars, API inputs, LLM output parsing) |
| Logging | Pino |
| Testing | Jest |
| Containerization | Docker + Docker Compose |

---

## Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- MongoDB Atlas account (free M0 cluster) — or Docker for local MongoDB
- [Groq API key](https://console.groq.com) (free tier)
- [OpenWeatherMap API key](https://openweathermap.org/api) (free tier)

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all required values in `.env` (see [Environment Variables](#environment-variables) below).

### 3. Start development server

```bash
pnpm dev
```

The server starts at `http://localhost:5000`.

| URL | Description |
|---|---|
| `http://localhost:5000/health` | Health check |
| `http://localhost:5000/docs` | Interactive API docs (Scalar UI) |
| `http://localhost:5000/openapi.json` | OpenAPI 3.0 spec |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net
MONGO_DB_NAME=ai-travel-planner

# Logging
LOG_LEVEL=info

# JWT
JWT_ACCESS_SECRET=<minimum 32 characters, random>
JWT_REFRESH_SECRET=<minimum 32 characters, random, different from above>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Groq LLM
GROQ_API_KEY=gsk_...
GROQ_PRIMARY_MODEL=llama-3.3-70b-versatile
GROQ_FALLBACK_MODEL=llama-3.1-8b-instant

# LangSmith tracing (optional)
LANGSMITH_API_KEY=
LANGCHAIN_TRACING_V2=false

# Weather
OPENWEATHER_API_KEY=<your key>
OPENWEATHER_BASE_URL=https://api.openweathermap.org

# CORS
FRONTEND_URL=http://localhost:5173
```

All variables are validated at startup via Zod (`src/config/env.ts`). The server refuses to start if any required variable is missing or invalid.

---

## Running with Docker

Docker Compose spins up the backend + a local MongoDB instance:

```bash
docker compose up --build
```

- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled production build |
| `pnpm test` | Run Jest test suite |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |

---

## Project Structure

```
src/
├── app.ts                      # Express app — CORS, helmet, middleware, routes
├── server.ts                   # HTTP server startup + graceful shutdown
├── config/
│   ├── env.ts                  # Zod env validation (fails fast on bad config)
│   ├── logger.ts               # Pino logger singleton
│   └── database.ts             # MongoDB connection config
├── database/
│   ├── connection.ts           # Mongoose connect/disconnect
│   └── models/
│       ├── user.model.ts       # User + preferences + budgetLedger
│       ├── trip.model.ts       # Trip + itinerary + weather + hotels + checkpoints
│       ├── refresh-token.model.ts
│       └── ai-log.model.ts     # Every LLM call logged (model, tokens, latency)
├── middleware/
│   ├── auth.middleware.ts      # JWT verification → req.user
│   ├── error.middleware.ts     # Global error handler
│   └── request-logger.ts      # Pino HTTP request logging
├── modules/                    # Feature modules (route → controller → service)
│   ├── auth/
│   ├── ai/                     # Core: AI trip generation pipeline
│   ├── trips/                  # Trip CRUD + state machine
│   ├── itinerary/              # Single-day regeneration
│   ├── assistant/              # Optimization, conflict detection, scoring
│   ├── activities/
│   ├── hotels/
│   ├── weather/
│   ├── budget/
│   ├── users/
│   └── analytics/
├── services/                   # Shared business logic + external API clients
│   ├── groq.service.ts         # LLM invocation (primary + fallback)
│   ├── ai-fallback.service.ts  # Retry orchestration
│   ├── llm-parser.service.ts   # Parse + Zod-validate LLM JSON output
│   ├── weather-provider.service.ts
│   ├── weather-analysis.service.ts
│   ├── hotel-provider.service.ts
│   ├── activity-provider.service.ts
│   ├── activity-classifier.service.ts
│   ├── booking-link.service.ts
│   ├── budget.service.ts
│   ├── conflict-detector.service.ts
│   ├── optimization-engine.service.ts
│   ├── recommendation-engine.service.ts
│   ├── itinerary-scoring.service.ts
│   ├── itinerary-regeneration.service.ts
│   ├── token.service.ts
│   ├── password.service.ts
│   └── auth.service.ts
└── utils/
    ├── api-response.ts         # Standardised success response wrapper
    ├── api-error.ts            # AppError class with HTTP status
    ├── async-handler.ts        # Wraps async controllers (no try/catch boilerplate)
    └── validators.ts           # Shared Zod schemas
```

---

## API Reference

All routes are prefixed `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login, returns token pair |
| POST | `/auth/refresh` | No | Rotate access + refresh tokens |
| POST | `/auth/logout` | Yes | Invalidate refresh token |

### AI Generation

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/trips/generate` | Yes | Generate full AI itinerary |

### Trips

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/trips` | Yes | List user's trips |
| POST | `/trips` | Yes | Create trip record |
| GET | `/trips/:id` | Yes | Get trip detail |
| PATCH | `/trips/:id` | Yes | Update trip |
| DELETE | `/trips/:id` | Yes | Delete trip |
| POST | `/trips/:id/activities` | Yes | Add activity to a day |
| PATCH | `/trips/:id/activities/:actId` | Yes | Update activity |
| DELETE | `/trips/:id/activities/:actId` | Yes | Remove activity |
| PATCH | `/trips/:id/itinerary/day/:day/regenerate` | Yes | Regenerate one day with AI |

### AI Assistant

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/assistant/optimize-trip` | Yes | Activity reorder suggestions |
| POST | `/assistant/check-conflicts` | Yes | Detect scheduling/weather/budget conflicts |
| POST | `/assistant/recommend-alternatives` | Yes | Alternative activity suggestions |
| GET | `/assistant/trips/:id/score` | Yes | Itinerary quality score (0–100, 6 dimensions) |

### Other Modules

| Method | Path | Description |
|---|---|---|
| GET | `/weather/:city` | 5-day weather forecast |
| GET | `/hotels` | Hotel search |
| GET | `/activities` | Activity search |
| GET | `/budget` | User budget summary |
| PATCH | `/budget` | Update budget |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile |
| GET | `/analytics` | Trip analytics |

Full interactive docs available at `/docs` when the server is running.

---

## AI Generation Pipeline

When `POST /ai/trips/generate` is called, the server runs this synchronous pipeline before responding:

```
1. Prompt Construction
   └─ Inject destination, dates, budget tier, user preferences into LangChain PromptTemplate

2. LLM Invocation (with automatic fallback)
   ├─ Primary:  Groq llama-3.3-70b-versatile  (temp=0.2, max=6000 tokens)
   └─ Fallback: Groq llama-3.1-8b-instant     (on timeout or error)

3. Response Parsing & Validation
   └─ Strip markdown fences → JSON.parse → Zod validate against TripPlanSchema

4. Weather Enrichment (per day)
   └─ OpenWeatherMap 5-day forecast → WeatherSnapshot per travel date

5. Hotel & Activity Enrichment
   ├─ Hotels: ratings, nightly rates, booking links
   └─ Activities: category classification, booking URLs, price estimates

6. Conflict Detection → Decision Checkpoints
   ├─ Weather conflicts: outdoor activities on rainy/stormy days
   └─ Schedule conflicts: time overlaps, unrealistic travel times

7. Budget Allocation
   └─ Sum costs → check user budget ledger → allocate or flag as checkpoint

8. Persist & Return
   └─ Save Trip + AILog → return full trip object to client
```

---

## Data Models

### User

```typescript
{
  fullName: string
  email: string          // unique
  passwordHash: string
  preferences: {
    travelStyle: string
    hotelTier: string
    preferredCurrency: string
    dietaryPreferences: string[]
    activityPreferences: string[]
    avoidActivities: string[]
  }
  budgetLedger: {
    totalBudget: number
    allocatedBudget: number
    spentBudget: number
    remainingBudget: number
    entries: LedgerEntry[]  // full allocation history
  }
}
```

### Trip

```typescript
{
  owner: ObjectId           // → User
  destinationCity: string
  destinationCountry: string
  latitude: number
  longitude: number
  startDate: Date
  endDate: Date
  totalDays: number
  budgetTier: string
  allocatedBudgetAmount: number
  estimatedCost: number
  status: "draft" | "planned" | "active" | "completed" | "cancelled"
  itinerary: DayPlan[]      // one per travel day
  hotelRecommendations: Hotel[]
  decisionCheckpoints: Checkpoint[]  // conflicts awaiting user resolution
}
```

### DayPlan

```typescript
{
  dayNumber: number
  title: string
  summary: string
  dayStatus: string
  weatherSnapshot: {
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    precipitationChance: number
    weatherType: string
    isOutdoorFriendly: boolean
    advisoryMessage: string
  }
  activities: Activity[]    // 3 per day
}
```

---

## Authentication Flow

```
Register  →  bcrypt hash password  →  create User  →  issue token pair
Login     →  verify email + password  →  issue token pair (refresh token stored in DB)
Request   →  authMiddleware verifies JWT  →  loads User  →  req.user
Refresh   →  validate refresh token in DB  →  rotate tokens  →  old token invalidated
Logout    →  delete refresh token from DB
```

---

## Testing

```bash
pnpm test
```

Jest unit tests cover: auth, budget, trips, AI pipeline, itinerary, weather services.

---

## Deployment

The backend is Dockerized and deployable to any container platform (Render, Railway, Fly.io, AWS ECS).

1. Build the image: `docker build -t voyageur-backend .`
2. Set all production env vars (especially `NODE_ENV=production`, strong JWT secrets, Atlas URI)
3. Set `FRONTEND_URL` to your deployed frontend URL for CORS

---

## License

MIT
