const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, unique: true },
    zone: { type: String, required: true, enum: ["A", "B", "C", "VIP"] },
    level: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["available", "occupied", "reserved"], default: "available" },
    hourlyRate: { type: Number, required: true, min: 0 },
    amenities: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slot", slotSchema);
