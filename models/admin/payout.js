import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  amount: { type: Number, required: true }, // doctorEarnings
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date }, // timestamp when admin releases payment
});

export const Payout   =  mongoose.model("Payout", payoutSchema);
