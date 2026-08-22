const express = require("express");
const router = express.Router();

const {
    refreshEvents,
    getCachedEvents,
    refreshSGO
} = require("../controllers/cacheController");

//ukoddsapi events
router.post(
    "/refresh-events",
    refreshEvents
);

router.post(
    "/refresh-sgo-events",
    refreshSGO
);

router.get(
    "/events",
    getCachedEvents
);


module.exports = router;