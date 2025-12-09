import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
    unique: true, // One bank detail per doctor
  },
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: { type: String, required: true },
  ifscCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const BankDetails =  mongoose.model("BankDetails", bankDetailsSchema);
