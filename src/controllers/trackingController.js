const RoutePoint = require("../models/RoutePoint");
const User = require("../models/User");
const Journey = require("../models/Journey");

const addRoutePoint = async (req, res) => {
  try {
    const {
      journeyId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
    } = req.body;
    const salesmanId = req.user._id;

    // Verify journey exists and belongs to user
    const journey = await Journey.findOne({
      _id: journeyId,
      salesmanId,
      status: "active",
    });

    if (!journey) {
      return res.status(404).json({ error: "Active journey not found" });
    }

    // Create route point
    const routePoint = new RoutePoint({
      journeyId,
      salesmanId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      timestamp: new Date(),
    });

    await routePoint.save();

    // Update user's last location
    await User.findByIdAndUpdate(salesmanId, {
      lastLocation: {
        latitude,
        longitude,
        timestamp: new Date(),
      },
    });

    // Emit real-time update (if using Socket.IO)
    req.io?.emit("locationUpdate", {
      salesmanId,
      journeyId,
      latitude,
      longitude,
      timestamp: routePoint.timestamp,
    });

    res.status(201).json({
      message: "Location updated successfully",
      routePoint,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLiveTracking = async (req, res) => {
  try {
    const { salesmanId } = req.params;

    // Get active journey
    const activeJourney = await Journey.findOne({
      salesmanId,
      status: "active",
    }).populate("salesmanId", "name email");

    if (!activeJourney) {
      return res.status(404).json({ error: "No active journey found" });
    }

    // Get recent route points (last 50 points)
    const recentPoints = await RoutePoint.find({ journeyId: activeJourney._id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      journey: activeJourney,
      recentPoints: recentPoints.reverse(),
      lastUpdate: recentPoints[0]?.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllActiveSalesmen = async (req, res) => {
  try {
    const activeJourneys = await Journey.find({ status: "active" })
      .populate("salesmanId", "name email phone")
      .select("salesmanId startTime startLocation");

    const activeSalesmenWithLocations = await Promise.all(
      activeJourneys.map(async (journey) => {
        const lastPoint = await RoutePoint.findOne({
          journeyId: journey._id,
        }).sort({ timestamp: -1 });

        return {
          salesman: journey.salesmanId,
          journey: {
            id: journey._id,
            startTime: journey.startTime,
            startLocation: journey.startLocation,
          },
          lastLocation: lastPoint
            ? {
                latitude: lastPoint.latitude,
                longitude: lastPoint.longitude,
                timestamp: lastPoint.timestamp,
              }
            : journey.startLocation,
          isOnline: lastPoint
            ? Date.now() - new Date(lastPoint.timestamp).getTime() <
              5 * 60 * 1000
            : false, // 5 minutes
        };
      })
    );

    res.json({
      activeSalesmen: activeSalesmenWithLocations,
      total: activeSalesmenWithLocations.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRoutePoint,
  getLiveTracking,
  getAllActiveSalesmen,
};
