import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g., "10:00 AM"
  endTime: { type: String, required: true }    // e.g., "02:00 PM"
});

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    required: true
  },
  isAvailable: { type: Boolean, default: false },
  timeSlots: [timeSlotSchema]
});

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    unique: true // one availability document per doctor
  },
  days: [daySchema]
}, { timestamps: true });

export const DoctorAvailability =  mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
