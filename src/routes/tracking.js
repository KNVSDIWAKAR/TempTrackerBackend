const express = require("express");
const router = express.Router();
const {
  addRoutePoint,
  getLiveTracking,
  getAllActiveSalesmen,
} = require("../controllers/trackingController");
const { auth, authorize } = require("../middleware/auth");

router.post("/location", auth, addRoutePoint);
router.get(
  "/live/:salesmanId",
  auth,
  authorize("manager", "admin"),
  getLiveTracking
);
router.get(
  "/active-salesmen",
  auth,
  authorize("manager", "admin"),
  getAllActiveSalesmen
);

module.exports = router;
