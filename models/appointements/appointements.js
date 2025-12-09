import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig" }, // optional if using gigs
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed", "cancelled"], default: "pending" },
  meetingLink: { type: String },
  amount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["paid", "pending", "failed"], default: "pending" },
  payoutStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
  stripePaymentIntentId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
