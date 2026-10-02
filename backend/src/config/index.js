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
  }
};
