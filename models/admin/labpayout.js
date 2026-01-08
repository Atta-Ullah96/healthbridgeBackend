import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paidAt: Date,
  },
  { timestamps: true }
);

export const LabPayout = mongoose.model("LabPayout" , payoutSchema)