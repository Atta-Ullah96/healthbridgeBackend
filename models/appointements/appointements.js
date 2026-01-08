import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },

  // Payment & status
  amount: { type: Number, required: true }, // total amount paid by patient
  commission: { type: Number, default: 0 }, // platform commission
  doctorEarnings: { type: Number, default: 0 }, // amount doctor earns
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  status: {
  type: String,
  enum: [
    "pending",        // appointment created
    "paid",           // payment done (waiting doctor)
    "confirmed",      // doctor accepted
    "rejected",       // doctor rejected
    "completed",      // visit done
    "cancelled"       // patient/admin cancelled
  ],
  default: "pending"
},

  // Stripe fields
  checkoutSessionId: { type: String },
  paymentIntentId: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);

