module.exports = {
  PORT: process.env.PORT || 3000,

  SPORTSGAMEODDS: {
    API_KEY: process.env.SPORTSGAMEODDS_KEY,
    BASE_URL: "https://api.sportsgameodds.com/v2",

    LEAGUES: [
      {
        leagueID: "MLB",
        sportID: "BASEBALL"
      },
      {
        leagueID: "MLS",
        sportID: "SOCCER"
      },
      {
        leagueID: "NCAAF",
        sportID: "FOOTBALL"
      }
    ]
  }
};