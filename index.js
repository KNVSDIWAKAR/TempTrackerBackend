const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const connectDB = require("./src/config/database");

// Import routes
const authRoutes = require("./src/routes/auth");
const journeyRoutes = require("./src/routes/journeys");
const trackingRoutes = require("./src/routes/tracking");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journeys", journeyRoutes);
app.use("/api/tracking", trackingRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Salesman Tracking API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinRoom", (salesmanId) => {
    socket.join(`salesman_${salesmanId}`);
    console.log(`Socket ${socket.id} joined room: salesman_${salesmanId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
