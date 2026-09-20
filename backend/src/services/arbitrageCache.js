const arbitrageCache = {};

function addOpportunity(opportunity) {
    arbitrageCache[opportunity.eventID] = opportunity;
}

function getOpportunities() {
    return Array
}