import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema({
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true
  },
  testName: { type: String, required: true },
  price: { type: Number, required: true },

}, { timestamps: true });

export const LabTest = mongoose.model("LabTest" , labTestSchema)