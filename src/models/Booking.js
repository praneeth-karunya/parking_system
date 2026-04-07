const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    vehicleType: { type: String, enum: ["car", "bike", "ev"], required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    amount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
