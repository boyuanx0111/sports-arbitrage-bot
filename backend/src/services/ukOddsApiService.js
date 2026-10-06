const axios = require("axios");

const { UKODDS } = require("../config");

async function verifyUKOddsApi() {

    try {

        const response = await axios.get(
            `${UKODDS.BASE_URL}/v1/auth/verify`,
            {
                headers: {
                    "X-Api-Key": UKODDS.API_KEY
                }
            }
        );

        return response.data;

    } catch (error) {

        console.log("UK Odds API error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

async function getFootballEvents(scheduleDate, league) {
    try {
        const response = await axios.get(
            `${UKODDS.BASE_URL}/v1/football/events`,
            {
                headers: {
                    "X-Api-Key": UKODDS.API_KEY
                },
                params: {
                    schedule_date: scheduleDate,
                    league
                }
            }
        );

        return response.data;

    } catch (error) {
        console.log("UK Odds API events error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

async function getEventOdds(eventID) {
    try {
        const response = await axios.get(
            `${UKODDS.BASE_URL}/v1/football/events/${eventID}/odds`,
            {
                headers: {
                    "X-Api-Key": UKODDS.API_KEY
                },
                params: {
                    package: "core",
                    odds_format: "decimal"
                }
            }
        );

        return response.data;

    } catch (error) {
        console.log("UK Odds API odds error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

async function getEventOddsBatch(eventIDs) {
    try {
        const response = await axios.post(
            `${UKODDS.BASE_URL}/v1/football/odds/batch`,
            {
                event_ids: eventIDs
            },
            {
                headers: {
                    "X-Api-Key": UKODDS.API_KEY
                },
                params: {
                    package: "core",
                    odds_format: "decimal"
                }
            }
        );

        return response.data;

    } catch (error) {
        console.log("UK Odds API batch odds error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

async function getFootballEventsRange(from, to, league, options = {}) {
    try {
        const response = await axios.get(
            `${UKODDS.BASE_URL}/v1/football/events`,
            {
                headers: {
                    "X-Api-Key": UKODDS.API_KEY
                },
                params: {
                    package: "core",
                    odds_format: "decimal",
                    schedule_date: options.scheduleDate || from,
                    per_page: options.perPage || 25,
                    ...(options.page ? { page: options.page } : {}),
                    from,
                    to,
                    ...(league ? { league } : {}),
                    upcoming: options.upcoming !== false,
                    has_odds: options.hasOdds !== false
                }
            }
        );

        return response.data;

    } catch (error) {
        console.log("UK Odds API events range error:");
        console.log(error.response?.data || error.message);

        throw error;
    }
}

module.exports = {
    verifyUKOddsApi,
    getFootballEvents,
    getEventOdds,
    getEventOddsBatch,
    getFootballEventsRange
};
