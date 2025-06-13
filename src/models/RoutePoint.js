const mongoose = require("mongoose");

const routePointSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
    },
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number, // in meters
    },
    speed: {
      type: Number, // in km/h
    },
    heading: {
      type: Number, // in degrees
    },
    altitude: {
      type: Number, // in meters
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
routePointSchema.index({ journeyId: 1, timestamp: 1 });
routePointSchema.index({ salesmanId: 1, timestamp: -1 });

module.exports = mongoose.model("RoutePoint", routePointSchema);
