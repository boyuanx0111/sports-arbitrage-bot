// src/debug/testData/arbTestData.js

module.exports = [
  // 1) Clear arbitrage case
  [
    {
      bookmaker: "unibet",
      eventID: "clearly arbitrage",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.2 },
        { outcome: "away", odds: 2.05 }
      ]
    },
    {
      bookmaker: "draftkings",
      eventID: "clearly arbitrage",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.15 },
        { outcome: "away", odds: 2.1 }
      ]
    }
  ],

  // 2) Arbitrage edge case
  // Very small arb, barely above 2%, should still technically be arbitrage
  [
    {
      bookmaker: "bet365",
      eventID: "test-edge-arb",
      homeTeam: "Liverpool",
      awayTeam: "Manchester City",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.041 },
        { outcome: "away", odds: 1.85 }
      ]
    },
    {
      bookmaker: "williamhill",
      eventID: "test-edge-arb",
      homeTeam: "Liverpool",
      awayTeam: "Manchester City",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 1.85 },
        { outcome: "away", odds: 2.041 }
      ]
    }
  ],

  // 3) Arbitrage, but less than the 2% filter
  [
    {
      bookmaker: "unibet",
      eventID: "test-sub-2-percent",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 1.99 },
        { outcome: "away", odds: 2.02 }
      ]
    },
    {
      bookmaker: "betfair",
      eventID: "test-sub-2-percent",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.01 },
        { outcome: "away", odds: 2.0 }
      ]
    }
  ],

  // 4) Non-arbitrage clear case
  [
    {
      bookmaker: "fanDuel",
      eventID: "test-no-arb-clear",
      homeTeam: "Bayern Munich",
      awayTeam: "Dortmund",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 1.75 },
        { outcome: "away", odds: 2.1 }
      ]
    },
    {
      bookmaker: "caesars",
      eventID: "test-no-arb-clear",
      homeTeam: "Bayern Munich",
      awayTeam: "Dortmund",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 1.78 },
        { outcome: "away", odds: 2.05 }
      ]
    }
  ],

  // 5) Non-arbitrage edge case
  // Very close to break-even, but still not an arb
  [
    {
      bookmaker: "pointsbet",
      eventID: "test-no-arb-edge",
      homeTeam: "Juventus",
      awayTeam: "Inter",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.0 },
        { outcome: "away", odds: 1.99 }
      ]
    },
    {
      bookmaker: "betmgm",
      eventID: "test-no-arb-edge",
      homeTeam: "Juventus",
      awayTeam: "Inter",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 1.98 },
        { outcome: "away", odds: 2.0 }
      ]
    }
  ],

  // 6) Exact break-even case
  // Useful to make sure your arb check does not falsely return true
  [
    {
      bookmaker: "testbook1",
      eventID: "test-break-even",
      homeTeam: "PSG",
      awayTeam: "Marseille",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.0 },
        { outcome: "away", odds: 2.0 }
      ]
    },
    {
      bookmaker: "testbook2",
      eventID: "test-break-even",
      homeTeam: "PSG",
      awayTeam: "Marseille",
      marketType: "ml",
      outcomes: [
        { outcome: "home", odds: 2.0 },
        { outcome: "away", odds: 2.0 }
      ]
    }
  ]
];