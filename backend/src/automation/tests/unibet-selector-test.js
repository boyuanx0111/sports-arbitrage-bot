// IN DEVELOPMENT: Manual selector check; this is not part of the automated test suite.
const {
    launchUnibet,
    search,
    selectEvent
} = require("../sportsbooks/unibet");


async function test(){

    const { page } = await launchUnibet();

    const event = {
        homeTeam: "Cincinnati Reds",
        awayTeam: "Cleveland Guardians",
        time: "01:40"
    };

    await search(
        page,
        `${event.homeTeam}`
    );

    await selectEvent(
        page,
        event
    );

}


test();
