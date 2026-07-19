# Sports Arbitrage Bot

> An automated sports arbitrage betting system that identifies profitable arbitrage opportunities across multiple sportsbooks and executes both sides of the wager.

> **⚠️ Disclaimer:** This project is for educational and research purposes only. Users are responsible for complying with all applicable laws and sportsbook terms of service.

---

# Current Status

**Current Phase:** Phase 2 – Backend Foundation ✅

### Completed

* Express.js backend
* React (Vite) frontend
* Layered backend architecture
* Health check endpoint
* Placeholder odds endpoint
* GitHub version control

### Next

* Integrate a live odds API
* Build the arbitrage calculation engine

---

# Features

## Current

* Express.js backend API
* React frontend
* Modular backend architecture
* Health endpoint
* Placeholder odds endpoint
* Scalable project structure

## Planned

* Live odds retrieval
* Arbitrage detection
* Stake calculation
* Browser automation with Playwright
* Live dashboard
* Profit tracking
* Betting history
* Notifications

---

# How It Works

The completed application will continuously monitor supported sportsbooks for arbitrage opportunities.

The planned workflow is:

1. Fetch the latest odds from supported sportsbooks
2. Detect arbitrage opportunities
3. Calculate the optimal stake for each outcome
4. Automatically place both bets (optional)
5. Record betting history and profit

The current version establishes the project architecture that future phases will build upon.

---

# Tech Stack

| Component          | Technology               |
| ------------------ | ------------------------ |
| Backend            | Node.js, Express.js      |
| Frontend           | React, Vite              |
| Package Manager    | npm                      |
| Version Control    | Git & GitHub             |
| Odds Data          | The Odds API *(planned)* |
| Browser Automation | Playwright *(planned)*   |

---

# Project Structure

```text
sports-arb-bot/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   │
│   │   ├── routes/
│   │   │   ├── health.js
│   │   │   ├── odds.js
│   │   │   ├── arbitrage.js
│   │   │   └── bookmakers.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── healthController.js
│   │   │   ├── oddsController.js
│   │   │   ├── arbitrageController.js
│   │   │   └── bookmakersController.js
│   │   │
│   │   ├── services/
│   │   │   ├── healthService.js
│   │   │   ├── oddsService.js
│   │   │   ├── arbitrageService.js
│   │   │   ├── bookmakerService.js
│   │   │   └── betService.js
│   │   │
│   │   ├── config/
│   │   │   └── index.js
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   ├── oddsConverter.js
│   │   │   └── stakeCalculator.js
│   │   │
│   │   └── data/
│   │       └── supportedBookmakers.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   └── src/
│
├── docs/
│
├── .github/
│   └── workflows/
│
├── .gitignore
└── README.md
```

---

# Backend Architecture

The backend follows a layered architecture to keep responsibilities separated and the codebase easy to extend.

```text
Frontend
    │
    ▼
Routes
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Odds API / Business Logic
```

### Routes

Define the application's API endpoints.

Examples:

* `/health`
* `/odds`
* `/arbitrage`

Routes simply direct incoming requests to the appropriate controller.

---

### Controllers

Handle HTTP requests and responses.

Responsibilities include:

* Receiving requests
* Reading parameters or request data
* Calling the appropriate service
* Returning JSON responses

Controllers coordinate the request but contain very little business logic.

---

### Services

Contain the application's business logic.

Examples include:

* Fetching odds from external APIs
* Detecting arbitrage opportunities
* Calculating optimal stake sizes
* Placing bets
* Managing bookmaker interactions

Most of the project's functionality will be implemented within this layer.

---

### Config

Stores application configuration such as:

* Server port
* API keys
* Refresh intervals

---

### Utils

Contains reusable helper functions shared across the application.

Examples include:

* Odds conversion
* Stake calculations
* Date formatting
* General utility functions

---

# Roadmap

## Development Roadmap

### Phase 1 — Project Setup -- COMPLETE
- Initialise GitHub repository
- Set up backend (Node.js + Express)
- Set up frontend (React + Vite)
- Configure project structure
- Install dependencies and development tools

### Phase 2 — Backend Foundation -- COMPLETE
- Configure Express server
- Create routes, controllers and services
- Add middleware and logging
- Build initial API structure
- Verify backend with development server

### Phase 3 — Arbitrage Detection Engine
- Build arbitrage calculation logic
- Create calculation utilities
- Develop arbitrage API endpoint
- Validate requests and responses
- Test with Postman
- Add unit tests

### Phase 4 — Sportsbook Integration
- Connect to live odds sources
- Standardise bookmaker data
- Retrieve and compare odds
- Feed live odds into the arbitrage engine

### Phase 5 — Browser Automation
- Integrate Playwright
- Log in to supported sportsbooks
- Navigate betting markets
- Place bets automatically
- Handle errors and confirmations

### Phase 6 — Frontend Dashboard
- Build React dashboard
- Display live arbitrage opportunities
- Show betting history and profit
- Add bot controls and status monitoring

### Phase 7 — Database & Persistence
- Store betting history
- Save arbitrage opportunities
- Track profit and performance
- Manage application settings

### Phase 8 — Testing & Deployment
- End-to-end testing
- Improve error handling
- Optimise performance
- Prepare production deployment
- Complete documentation

---

# Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/sports-arbitrage-bot.git
cd sports-arbitrage-bot
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

---

# Environment Variables

Create a `.env` file inside the `backend` directory.

```env
PORT=3000

ODDS_API_KEY=

HEADLESS=true
```

Additional environment variables for sportsbook credentials and notifications will be introduced in later phases.

---

# Project Goals

The MVP focuses on:

* Supporting two sportsbooks
* Detecting arbitrage opportunities in real time
* Calculating optimal stake sizes
* Providing a simple web dashboard
* Building a clean and maintainable codebase that can be extended as new sportsbooks and features are added

---

# License

This project is licensed under the MIT License.
