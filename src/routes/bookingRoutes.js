const express = require("express");
const Booking = require("../models/Booking");
const Slot = require("../models/Slot");

const router = express.Router();

router.get("/", async (req, res) => {
  const bookings = await Booking.find().populate("slot").sort({ createdAt: -1 });
  res.json(bookings);
});

router.get("/stats", async (req, res) => {
  const completed = await Booking.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  const active = await Booking.countDocuments({ status: "active" });
  const cancelled = await Booking.countDocuments({ status: "cancelled" });

  res.json({
    totalRevenue: completed[0]?.total || 0,
    completedBookings: completed[0]?.count || 0,
    activeBookings: active,
    cancelledBookings: cancelled
  });
});

router.patch("/cleanup-expired", async (req, res) => {
  const now = new Date();
  const expired = await Booking.find({
    status: "active",
    endTime: { $lte: now }
  });

  if (!expired.length) return res.json({ updated: 0 });

  const ids = expired.map((b) => b._id);
  await Booking.updateMany({ _id: { $in: ids } }, { $set: { status: "completed" } });

  const slotIds = expired.map((b) => b.slot);
  await Slot.updateMany({ _id: { $in: slotIds } }, { $set: { status: "available" } });

  res.json({ updated: expired.length });
});

router.post("/", async (req, res) => {
  const { customerName, vehicleNumber, vehicleType, slotId, startTime, endTime } = req.body;
  const slot = await Slot.findById(slotId);

  if (!slot || slot.status !== "available") {
    return res.status(400).json({ message: "Selected slot is not available" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
  const amount = durationHours * slot.hourlyRate;

  const booking = await Booking.create({
    customerName,
    vehicleNumber,
    vehicleType,
    slot: slot._id,
    startTime: start,
    endTime: end,
    amount
  });

  slot.status = "reserved";
  await slot.save();

  const populated = await booking.populate("slot");
  res.status(201).json(populated);
});

router.patch("/:id/complete", async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("slot");
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  booking.status = "completed";
  await booking.save();

  const slot = await Slot.findById(booking.slot._id);
  if (slot) {
    slot.status = "available";
    await slot.save();
  }

  res.json({ message: "Booking completed", booking });
});

router.patch("/:id/cancel", async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("slot");
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status !== "active") {
    return res.status(400).json({ message: "Only active bookings can be cancelled" });
  }

  booking.status = "cancelled";
  await booking.save();

  const slot = await Slot.findById(booking.slot?._id);
  if (slot) {
    slot.status = "available";
    await slot.save();
  }

  res.json({ message: "Booking cancelled", booking });
});

module.exports = router;
