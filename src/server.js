require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const slotRoutes = require("./routes/slotRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const BASE_PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Parking Management System" }));
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const startServer = (port) => {
  const server = app
    .listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
        startServer(nextPort);
        return;
      }
      console.error("Server startup failed:", err.message);
      process.exit(1);
    });

  return server;
};

connectDB()
  .then(() => startServer(BASE_PORT))
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });
