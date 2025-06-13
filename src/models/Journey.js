const mongoose = require("mongoose");

const journeySchema = new mongoose.Schema(
  {
    salesmanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    startLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: String,
    },
    endLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    totalDistance: {
      type: Number,
      default: 0, // in kilometers
    },
    totalDuration: {
      type: Number,
      default: 0, // in minutes
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    notes: String,
    routePointsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Journey", journeySchema);
