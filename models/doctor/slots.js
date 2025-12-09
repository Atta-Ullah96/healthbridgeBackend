import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },  // "10:00"
  endTime: { type: String, required: true },    // "10:30"
  isBooked: { type: Boolean, default: false }, // true if already booked
});

export const Slot = mongoose.model("Slot", slotSchema);
