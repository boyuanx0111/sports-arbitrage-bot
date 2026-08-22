const eventCache = {
    sgo: {
        events: [],
        lastUpdated: null
    },

    uk: {
        events: [],
        lastUpdated: null
    }
};


function setEvents(source, events) {

    if (!eventCache[source]) {
        throw new Error(
            `Unknown event cache source: ${source}`
        );
    }

    eventCache[source].events = events;
    eventCache[source].lastUpdated = new Date();
}


function getEvents(source) {

    if (!eventCache[source]) {
        throw new Error(
            `Unknown event cache source: ${source}`
        );
    }

    return eventCache[source].events;
}


function getLastUpdated(source) {

    if (!eventCache[source]) {
        throw new Error(
            `Unknown event cache source: ${source}`
        );
    }

    return eventCache[source].lastUpdated;
}


module.exports = {
    setEvents,
    getEvents,
    getLastUpdated
};