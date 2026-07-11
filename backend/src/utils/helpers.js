function getCurrentTimestamp() {
  return new Date().toISOString();
}

module.exports = {
  getCurrentTimestamp,
};

//small reusable helper functions (proof of concept here)