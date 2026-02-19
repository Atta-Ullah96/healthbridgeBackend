import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema({
  start: { type: String, required: true }, // "09:00"
  end: { type: String, required: true }    // "17:00"
});

const daySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true
  },
  isAvailable: { type: Boolean, default: false },
  timeSlots: [timeRangeSchema],
  breaks: [timeRangeSchema] // ✅ NEW
});

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    unique: true
  },
  days: [daySchema],
  
  isCompleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export const DoctorAvailability =
  mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
