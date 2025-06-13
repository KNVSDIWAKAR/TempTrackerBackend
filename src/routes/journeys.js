const express = require("express");
const router = express.Router();
const {
  startJourney,
  endJourney,
  getJourneys,
  getJourneyDetails,
} = require("../controllers/journeyController");
const { auth, authorize } = require("../middleware/auth");

router.post("/start", auth, startJourney);
router.post("/end", auth, endJourney);
router.get("/", auth, getJourneys);
router.get("/:journeyId", auth, getJourneyDetails);

module.exports = router;
