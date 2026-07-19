// Start the Express server and listen for incoming requests.

const app = require("./app");

const { PORT } = require("./config");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});