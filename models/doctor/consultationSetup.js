
import mongoose from "mongoose";

const consultationSetupSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    fee: { type: Number, required: true },
    duration: { type: Number, required: true }, // in minutes
    modes: [
      {
        type: String,
        enum: ["online", "physical"],
        required: true,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ConsultationSetup = mongoose.model(
  "ConsultationSetup",
  consultationSetupSchema
);
