# Sports Arbitrage Bot

> An automated sports arbitrage betting system that identifies profitable arbitrage opportunities across multiple sportsbooks and executes both sides of the wager.

> **⚠️ Disclaimer:** This project is for educational and research purposes only. Users are responsible for complying with all applicable laws and sportsbook terms of service.

---

## Features

- Scan multiple sportsbooks for arbitrage opportunities
- Calculate optimal stake sizes and guaranteed profit
- Automatic bet execution using browser automation
- Paper trading / simulation mode
- Live web dashboard
- Betting and profit history
- Logging and error handling
- Discord and Telegram notifications

---

## How It Works

The bot continuously monitors odds from supported sportsbooks.

When an arbitrage opportunity is detected, it:

1. Collects the latest odds
2. Calculates whether an arbitrage opportunity exists
3. Determines the optimal stake for each outcome
4. Automatically places both bets (if enabled)
5. Records the result and profit

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python, FastAPI |
| Frontend | React, Next.js |
| Database | PostgreSQL |
| Browser Automation | Playwright |
| ORM | SQLAlchemy |
| Notifications | Discord, Telegram |
| Containerization | Docker |
| CI/CD | GitHub Actions |

---

## Project Structure

```text
sports-arb-bot/
│
├── backend/
│   ├── api/
│   │   ├── routes.py
│   │   └── schemas.py
│   │
│   ├── arbitrage/
│   │   ├── engine.py
│   │   └── calculator.py
│   │
│   ├── bookmakers/
│   │   ├── base.py
│   │   ├── bet365.py
│   │   └── sportsbet.py
│   │
│   ├── database/
│   │   ├── database.py
│   │   └── models.py
│   │
│   ├── services/
│   │   ├── bot.py
│   │   └── history.py
│   │
│   ├── config.py
│   └── main.py
│
├── frontend/
│
├── tests/
│
├── docker/
│
├── docs/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## Roadmap

### Phase 1 – Foundation
- [ ] Repository setup
- [ ] FastAPI backend
- [ ] React/Next.js frontend
- [ ] PostgreSQL integration
- [ ] Configuration management

### Phase 2 – Arbitrage Engine
- [ ] Fetch odds from two sportsbooks
- [ ] Arbitrage detection engine
- [ ] Stake calculator
- [ ] Paper trading mode

### Phase 3 – Automation
- [ ] Playwright browser automation
- [ ] Automatic login
- [ ] Automatic bet placement
- [ ] Bet verification
- [ ] Basic risk management

### Phase 4 – Dashboard
- [ ] Live arbitrage opportunities
- [ ] Betting history
- [ ] Profit tracking
- [ ] Bot controls (Start / Stop)

### Phase 5 – Polish
- [ ] Docker deployment
- [ ] CI/CD pipeline
- [ ] Improved logging
- [ ] Notifications
- [ ] Performance improvements

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/sports-arb-bot.git
cd sports-arb-bot
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the environment:

**Windows**

```bash
.venv\Scripts\activate
```

**macOS/Linux**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn backend.main:app --reload
```

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=

BOOKMAKER_USERNAME=
BOOKMAKER_PASSWORD=

DISCORD_WEBHOOK=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

HEADLESS=true

LOG_LEVEL=INFO
```

---

## Development

Run tests:

```bash
pytest
```

Format code:

```bash
black .
```

Lint:

```bash
ruff check .
```

---

## Project Goals

The initial version of the project focuses on:

- Supporting **two sportsbooks**
- Detecting arbitrage opportunities in real time
- Automatically placing both bets using Playwright
- Providing a simple web dashboard for monitoring opportunities
- Building a clean, maintainable codebase that can be extended with additional sportsbooks

Once the core workflow is stable, additional sportsbooks and features can be added without major architectural changes.

---

## License

This project is licensed under the MIT License.
