const {
    launchUnibet
} = require("../sportsbooks/unibet");


const {
    startKeepAlive
} = require("../sessions/keepAlive");


const {
    startSessionMonitor
} = require("../sessions/sessionMonitor");



async function test() {

    // Launch browser ONCE
    const {
        page
    } = await launchUnibet();


    console.log(
        "Unibet browser started"
    );


    // Start session maintenance
    startKeepAlive(page);


    // Start login monitoring
    startSessionMonitor(page);


    console.log(
        "Keep alive + session monitor running..."
    );

}


test();