import mongoose from "mongoose";

const labTestBookingSchema = new mongoose.Schema({
 laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true
  },

  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  tests: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: "LabTest" },
    price: Number
  }],

  totalAmount: Number,

  // Stripe
  checkoutSessionId: String,
  paymentIntentId: String,

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  // Commission
  platformCommission: Number,
  labEarning: Number,

  orderStatus: {
    type: String,
    enum: ["pending", "sample_collected", "processing", "completed", "cancelled"],
    default: "pending"
  },
  isDeletedByLab: {
  type: Boolean,
  default: false
},

}, { timestamps: true });


export const Order = mongoose.model("Order" , labTestBookingSchema)