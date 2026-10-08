// IN DEVELOPMENT: Login/session detection is experimental and needs broader validation.
async function checkLoggedIn(page) {

    try {

        // Look for login button
        const loginButton =
            await page.getByText("Log in").first();

        const visible =
            await loginButton.isVisible()
            .catch(() => false);

        return !visible;

    } catch(error) {

        console.log(
            "Login check failed:",
            error.message
        );

        return false;

    }

}



function startSessionMonitor(page) {


    // Check immediately
    checkLoggedIn(page);


    // Check every 5 minutes
    setInterval(async()=>{


        const loggedIn =
            await checkLoggedIn(page);


        if(loggedIn){

            console.log(
                "Unibet session active"
            );

        } else {

            console.log(
                "Unibet session expired"
            );

        }


    },5 * 60 * 1000);


}



module.exports = {
    checkLoggedIn,
    startSessionMonitor
};
