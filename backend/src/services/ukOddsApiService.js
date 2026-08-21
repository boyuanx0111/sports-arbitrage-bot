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

async function getFootballEventsRange(from, to, league) {
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
                    from,
                    to,
                    league,
                    upcoming: true
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
    getFootballEventsRange
};