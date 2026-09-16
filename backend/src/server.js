// Start the Express server and listen for incoming requests.

// Load environment variables from .env
require("dotenv").config();

const app = require("./app");

const { PORT, SPORTSGAMEODDS } = require("./config");

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

//debuug
// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// console.log("Server listening:", server.listening);

// server.on("close", () => {
//   console.log("SERVER CLOSE EVENT");
// });

// server.on("error", (error) => {
//   console.error("SERVER ERROR:", error);
// });

// process.on("beforeExit", (code) => {
//   console.log("PROCESS BEFORE EXIT:", code);
// });

// process.on("exit", (code) => {
//   console.log("PROCESS EXIT:", code);
// });