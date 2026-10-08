// IN DEVELOPMENT: Session keep-alive behavior is experimental.
async function refreshSession(page) {

    try {

        console.log(
            "Refreshing Unibet session..."
        );


        await page.goto(
            "https://www.unibet.co.uk/betting/odds",
            {
                waitUntil: "domcontentloaded"
            }
        );


        console.log(
            "Unibet session refreshed"
        );


    } catch(error) {

        console.log(
            "Keep alive failed:",
            error.message
        );

    }

}



function startKeepAlive(page) {


    // optional: test immediately
    refreshSession(page);


    setInterval(() => {

        refreshSession(page);

    }, 10 * 60 * 1000);


}


module.exports = {
    startKeepAlive
};
