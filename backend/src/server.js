// Start the Express server and listen for incoming requests.

// Load environment variables from .env
require("dotenv").config();

const app = require("./app");

const { PORT, SPORTSGAMEODDS } = require("./config");

console.log(
  "Sportsgameodds API key loaded:",
  Boolean(SPORTSGAMEODDS.API_KEY)
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});