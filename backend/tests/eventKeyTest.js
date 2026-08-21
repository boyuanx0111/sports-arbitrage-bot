const { createEventKey } = require("../src/utils/helpers");

const sgoObject = {
    eventID: "3D5tsX4dyaYqH9z4pzEy",
    bookmaker: "fanduel",
    marketType: "sp",
    event_metadata: {
        homeTeam: "Atlanta United",
        awayTeam: "Sporting Kansas City",
        sport: "SOCCER",
        league: "MLS",
        startTime: "2026-08-23T23:00:00.000Z"
    },
    outcomes: [
        {
            outcome: "away",
            odds: 1.4878048780487805
        }
    ],
    periodID: "game",
    statID: "points",
    statEntityID: "away",
    line: NaN
};

const ukObject = {
    eventID: "evt_d0cc7812167e7963756a7e4104db",
    homeTeam: "Atlanta United",
    awayTeam: "Sporting Kansas City",
    sport: "football",
    league: "US Major League Matches",
    startTime: "2026-08-23T23:00:00Z",
    bookmaker: "10Bet",
    bookmakerCode: "UO001",
    marketType: "sp",
    line: "0.25",
    outcomes: [
        {
            outcome: "home",
            odds: 1.533
        },
        {
            outcome: "away",
            odds: 2.4
        }
    ]
};

const sgoKey = createEventKey(sgoObject);
const ukKey = createEventKey(ukObject);

console.log("SGO key:", sgoKey);
console.log("UK key:", ukKey);
console.log("Keys match:", sgoKey === ukKey);

if (sgoKey !== ukKey) {
    throw new Error("SGO and UK event keys do not match");
}

console.log("Test passed");