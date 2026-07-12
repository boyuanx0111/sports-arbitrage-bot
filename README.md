# Sports Arbitrage Bot

> An automated sports arbitrage betting system that identifies profitable arbitrage opportunities across multiple sportsbooks and executes both sides of the wager.

> **⚠️ Disclaimer:** This project is for educational and research purposes only. Users are responsible for complying with all applicable laws and sportsbook terms of service.

---

# Current Status

**Current Phase:** Phase 2 – Backend Foundation ✅

### Completed

* Express.js backend
* React (Vite) frontend
* Modular backend architecture
* Health check endpoint
* Placeholder odds endpoint
* GitHub repository and version control

### Next

* Integrate live odds API
* Build arbitrage calculation engine

---

# Features

## Current

* Express.js backend API
* React frontend
* Modular backend architecture
* Health endpoint
* Placeholder odds endpoint
* Clean and scalable project structure

## Planned

* Live odds retrieval from sportsbooks
* Arbitrage detection engine
* Stake calculator
* Browser automation with Playwright
* Live dashboard
* Profit tracking
* Betting history
* Notifications

---

# How It Works

The completed application will continuously monitor supported sportsbooks for arbitrage opportunities.

The planned workflow is:

1. Fetch the latest odds
2. Detect arbitrage opportunities
3. Calculate optimal stake sizes
4. Automatically place both bets (optional)
5. Track betting history and profit

The current version establishes the backend and frontend architecture that future phases will build upon.

---

# Tech Stack

| Component          | Technology               |
| ------------------ | ------------------------ |
| Backend            | Node.js, Express.js      |
| Frontend           | React, Vite              |
| Package Manager    | npm                      |
| Version Control    | Git & GitHub             |
| Odds API           | The Odds API *(planned)* |
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

The backend follows a simple layered architecture:

```text
Frontend
    │
    ▼
Routes
    │
    ▼
Services
    │
    ▼
Odds API / Calculations
```

### Routes

Define the API endpoints.

Examples:

* `/health`
* `/odds`
* `/arbitrage`

### Services

Contain the application's business logic.

Examples:

* Fetch live odds
* Detect arbitrage
* Calculate stake sizes
* Place bets

### Config

Stores application configuration.

### Utils

Reusable helper functions used throughout the project.

---

# Roadmap

## Phase 1 – Project Setup ✅

* GitHub repository
* Express backend
* React (Vite) frontend
* Initial project structure

---

## Phase 2 – Backend Foundation ✅

* Routes
* Services
* Configuration
* Utilities
* Health endpoint
* Placeholder odds endpoint

---

## Phase 3 – Live Odds Integration

* Connect to The Odds API
* Fetch live odds
* Parse API responses
* Support multiple bookmakers

---

## Phase 4 – Arbitrage Engine

* Detect arbitrage opportunities
* Calculate stake sizes
* Calculate guaranteed profit
* Paper trading mode

---

## Phase 5 – Frontend Dashboard

* Live odds display
* Arbitrage opportunities
* Profit calculations
* Dashboard controls

---

## Phase 6 – Automation

* Playwright browser automation
* Automatic sportsbook login
* Automatic bet placement
* Bet verification
* Notifications

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

Create a `.env` file inside the backend directory.

```env
PORT=3000

ODDS_API_KEY=

HEADLESS=true
```

Additional variables for sportsbook accounts and notifications will be added in later phases.

---

# Project Goals

The MVP focuses on:

* Supporting two sportsbooks
* Detecting arbitrage opportunities in real time
* Calculating optimal stake sizes
* Providing a simple web dashboard
* Building a clean and maintainable codebase

Once the MVP is stable, additional sportsbooks and features can be added without major architectural changes.

---

# License

This project is licensed under the MIT License.
