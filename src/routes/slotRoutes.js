const express = require("express");
const Slot = require("../models/Slot");
const { recommendSlots } = require("../services/aiAdvisor");

const router = express.Router();

router.get("/", async (req, res) => {
  const slots = await Slot.find().sort({ slotNumber: 1 });
  res.json(slots);
});

router.post("/", async (req, res) => {
  try {
    const { slotNumber, zone, level, hourlyRate, amenities = [] } = req.body;

    if (!slotNumber || !zone || !level || hourlyRate === undefined) {
      return res.status(400).json({ message: "slotNumber, zone, level and hourlyRate are required" });
    }

    const exists = await Slot.findOne({ slotNumber });
    if (exists) return res.status(409).json({ message: "Slot number already exists" });

    const slot = await Slot.create({
      slotNumber,
      zone,
      level: Number(level),
      hourlyRate: Number(hourlyRate),
      amenities,
      status: "available"
    });

    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ message: "Invalid slot data", error: err.message });
  }
});

router.post("/seed", async (req, res) => {
  const existing = await Slot.countDocuments();
  if (existing > 0) {
    return res.status(400).json({ message: "Slots already seeded" });
  }

  const sampleSlots = [
    { slotNumber: "A-101", zone: "A", level: 1, status: "available", hourlyRate: 40, amenities: ["covered"] },
    { slotNumber: "A-102", zone: "A", level: 1, status: "available", hourlyRate: 45, amenities: ["covered", "charging"] },
    { slotNumber: "B-201", zone: "B", level: 2, status: "available", hourlyRate: 30, amenities: [] },
    { slotNumber: "B-202", zone: "B", level: 2, status: "available", hourlyRate: 35, amenities: ["covered"] },
    { slotNumber: "C-301", zone: "C", level: 3, status: "available", hourlyRate: 20, amenities: [] },
    { slotNumber: "VIP-01", zone: "VIP", level: 1, status: "available", hourlyRate: 80, amenities: ["covered", "charging"] }
  ];

  const inserted = await Slot.insertMany(sampleSlots);
  res.status(201).json(inserted);
});

router.post("/ai-recommendations", async (req, res) => {
  const { vehicleType = "car", budgetPerHour = 50, wantsCovered = false } = req.body;
  const availableSlots = await Slot.find({ status: "available" });
  const data = recommendSlots(availableSlots, { vehicleType, budgetPerHour, wantsCovered });
  res.json(data);
});

module.exports = router;
