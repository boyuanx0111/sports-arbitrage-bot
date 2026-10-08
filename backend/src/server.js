// Start the Express server and listen for incoming requests.

// Load environment variables from .env
require("dotenv").config();

const app = require("./app");

const { PORT } = require("./config");

const {
  initialiseCaches,
  startSlowRefresh,
  startFastRefresh
} = require("./services/cacheInitialisation");


async function startServer() {

  try {

    await initialiseCaches();

    startSlowRefresh();
    startFastRefresh();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {

    console.error(
      "Server initialisation failed:",
      error
    );

    process.exit(1);
  }
}

startServer();
