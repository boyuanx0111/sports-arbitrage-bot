const { chromium } = require("playwright");

async function saveSession(){

    const browser = await chromium.launch({
        headless:false
    });

    const context = await browser.newContext();

    const page = await context.newPage();


    await page.goto(
        "https://www.unibet.co.uk"
    );


    console.log(
        "Login manually then press ENTER"
    );


    await new Promise(resolve => {

        process.stdin.once(
            "data",
            resolve
        );

    });


    await context.storageState({
        path:"src/automation/sessions/storage/unibet.json"
    });


    console.log(
        "Session saved"
    );


    await browser.close();

}


saveSession();

// node src/automation/tests/save-unibet-session.js