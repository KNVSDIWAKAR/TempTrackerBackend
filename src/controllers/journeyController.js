const Journey = require("../models/Journey");
const RoutePoint = require("../models/RoutePoint");

const startJourney = async (req, res) => {
  try {
    const { startLocation, notes } = req.body;
    const salesmanId = req.user._id;

    // Check if there's already an active journey
    const activeJourney = await Journey.findOne({
      salesmanId,
      status: "active",
    });

    if (activeJourney) {
      return res
        .status(400)
        .json({ error: "You already have an active journey" });
    }

    // Create new journey
    const journey = new Journey({
      salesmanId,
      startTime: new Date(),
      startLocation,
      notes,
      status: "active",
    });

    await journey.save();

    res.status(201).json({
      message: "Journey started successfully",
      journey,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const endJourney = async (req, res) => {
  try {
    const { journeyId, endLocation, notes } = req.body;
    const salesmanId = req.user._id;

    // Find the journey
    const journey = await Journey.findOne({
      _id: journeyId,
      salesmanId,
      status: "active",
    });

    if (!journey) {
      return res.status(404).json({ error: "Active journey not found" });
    }

    // Calculate total duration
    const endTime = new Date();
    const totalDuration = Math.round(
      (endTime - journey.startTime) / (1000 * 60)
    );

    // Get route points count and calculate distance
    const routePoints = await RoutePoint.find({ journeyId }).sort({
      timestamp: 1,
    });
    const totalDistance = calculateTotalDistance(routePoints);

    // Update journey
    journey.endTime = endTime;
    journey.endLocation = endLocation;
    journey.totalDuration = totalDuration;
    journey.totalDistance = totalDistance;
    journey.routePointsCount = routePoints.length;
    journey.status = "completed";
    if (notes) journey.notes = notes;

    await journey.save();

    res.json({
      message: "Journey ended successfully",
      journey,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJourneys = async (req, res) => {
  try {
    const salesmanId =
      req.user.role === "salesman" ? req.user._id : req.query.salesmanId;
    const { page = 1, limit = 10, status } = req.query;

    const query = salesmanId ? { salesmanId } : {};
    if (status) query.status = status;

    const journeys = await Journey.find(query)
      .populate("salesmanId", "name email")
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Journey.countDocuments(query);

    res.json({
      journeys,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJourneyDetails = async (req, res) => {
  try {
    const { journeyId } = req.params;

    const journey = await Journey.findById(journeyId).populate(
      "salesmanId",
      "name email"
    );

    if (!journey) {
      return res.status(404).json({ error: "Journey not found" });
    }

    // Check authorization
    if (
      req.user.role === "salesman" &&
      journey.salesmanId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const routePoints = await RoutePoint.find({ journeyId }).sort({
      timestamp: 1,
    });

    res.json({
      journey,
      routePoints,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate distance
const calculateTotalDistance = (routePoints) => {
  if (routePoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const distance = getDistanceBetweenPoints(
      routePoints[i - 1].latitude,
      routePoints[i - 1].longitude,
      routePoints[i].latitude,
      routePoints[i].longitude
    );
    totalDistance += distance;
  }

  return parseFloat(totalDistance.toFixed(2));
};

const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

module.exports = {
  startJourney,
  endJourney,
  getJourneys,
  getJourneyDetails,
};
