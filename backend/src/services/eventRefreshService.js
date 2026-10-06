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
const { UKODDS } = require("../config");

//UK cache refresh service
async function refreshUKEvents() {

    const today = new Date();
    const NumberOfDays = 5;

    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(
        oneWeekLater.getDate() + NumberOfDays
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

// Refresh the simulation's own UK event list. Keep it separate from the shared
// event cache used by the regular odds route.
async function refreshSimulationEvents() {
    const today = new Date();
    const fourDaysLater = new Date(today);
    fourDaysLater.setDate(fourDaysLater.getDate() + 4);
    const from = today.toISOString().split("T")[0];
    const to = fourDaysLater.toISOString().split("T")[0];

    if (UKODDS.API_KEY) {
        const perPage = 25;
        const events = [];
        let page = 1;
        let pageEvents;

        do {
            const response = await getFootballEventsRange(from, to, undefined, {
                scheduleDate: from,
                perPage,
                page,
                upcoming: true,
                hasOdds: true
            });
            pageEvents = response.events || response.data || [];
            events.push(...pageEvents);
            page += 1;
        } while (pageEvents.length === perPage);

        const uniqueEvents = Array.from(
            new Map(events.filter(event => event.event_id).map(event => [event.event_id, event])).values()
        );
        return {
            events: uniqueEvents,
            eventCount: uniqueEvents.length,
            eventIDs: uniqueEvents.map(event => event.event_id),
            from,
            to,
            updatedAt: new Date()
        };
    }

    throw new Error("UK Odds API is not configured for the simulation event search.");
}


module.exports = {
    refreshUKEvents,
    refreshSGOEvents,
    refreshSimulationEvents
};
