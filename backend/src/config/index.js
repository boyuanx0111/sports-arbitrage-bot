module.exports = {
  PORT: process.env.PORT || 3000,

  SPORTSGAMEODDS: {
    API_KEY: process.env.SPORTSGAMEODDS_KEY,
    BASE_URL: "https://api.sportsgameodds.com/v2",

  

    LEAGUES: [
      // {
      //   leagueID: "MLB",
      //   sportID: "BASEBALL"
      // },
      {
        leagueID: "MLS",
        sportID: "SOCCER"
      }
      // add comma back and uncomment to add more leagues
      // {
      //   leagueID: "NCAAF",
      //   sportID: "FOOTBALL"
      // }
    ]
  },

  UKODDS: {
    BASE_URL: process.env.UKODDS_BASE_URL || "https://api.ukoddsapi.com",
    API_KEY: process.env.UKODDS_API_KEY
  },

  API_FOOTBALL: {
    BASE_URL: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
    API_KEY: process.env.API_FOOTBALL_KEY,
    KICKOFF_TOLERANCE_MINUTES: Number(process.env.MAX_KICKOFF_DIFFERENCE_MINUTES || 15),
    SETTLEMENT_BUFFER_MINUTES: Number(process.env.RESULT_SETTLEMENT_BUFFER_MINUTES || 10),
    RETRY_INTERVAL_MS: Number(process.env.RESULT_RETRY_MINUTES || 5) * 60 * 1000,
    LEAGUE_MAP: (() => {
      try { return JSON.parse(process.env.API_FOOTBALL_LEAGUE_MAP || "{}"); } catch { return {}; }
    })()
  }
};
