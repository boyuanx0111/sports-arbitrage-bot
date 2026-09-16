const {
    getFootballEventsRange
} = require("./ukOddsApiService");

const {
    setEvents,
    getLastUpdated
} = require("./eventCacheService");

const axios = require("axios");

const {
    SPORTSGAMEODDS
} = require("../config");


//UK cache refresh service
async function refreshUKEvents() {

    const today = new Date();

    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(
        oneWeekLater.getDate() + 5
    );

    const from =
        today.toISOString().split("T")[0];

    const to =
        oneWeekLater.toISOString().split("T")[0];


    const eventsResponse =
        await getFootballEventsRange(
            from,
            to,
            "MLS"
        );


    const events =
        eventsResponse.events || [];


    const eventsWithOdds =
        events.filter(
            event =>
                event.markets_with_odds > 0
        );

    setEvents("uk", eventsWithOdds);


    return {
        eventCount: eventsWithOdds.length,
        updatedAt: getLastUpdated("uk")
    };
}

//SGO cache refresh service
async function refreshSGOEvents() {

    const responses = await Promise.all(
        SPORTSGAMEODDS.LEAGUES.map(
            ({ leagueID, sportID }) =>
                axios.get(
                    `${SPORTSGAMEODDS.BASE_URL}/events`,
                    {
                        headers: {
                            "X-API-Key": SPORTSGAMEODDS.API_KEY
                        },
                        params: {
                            leagueID,
                            sportID,
                            oddsAvailable: "true",
                            oddsPresent: "true",
                            limit: 20
                        }
                    }
                )
        )
    );


    const eventsByLeague = {};

    SPORTSGAMEODDS.LEAGUES.forEach(
        (league, index) => {

            eventsByLeague[league.leagueID] =
                responses[index].data.data;
        }
    );


    const allEvents =
        Object.values(eventsByLeague).flat();

    // Odds will be fetched fresh during each arbitrage scan, cache fixed metadata only 
    const cachedEvents = allEvents.map(event => ({
        eventID: event.eventID,
        sportID: event.sportID,
        leagueID: event.leagueID,

        teams: event.teams,

        status: {
            startsAt: event.status.startsAt,
            started: event.status.started,
            completed: event.status.completed,
            cancelled: event.status.cancelled
        }
    }));

    setEvents(
        "sgo",
        cachedEvents
    );


    return {
        eventCount: cachedEvents.length,
        updatedAt: getLastUpdated("sgo")
    };
}


module.exports = {
    refreshUKEvents,
    refreshSGOEvents
};