// models/ProfileSummary.js
import mongoose from "mongoose";

const profileSummarySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },

    about: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    languages: [
      {
        type: String,
        enum: [
          "English",
          "Urdu",
          "Punjabi",
          "Pashto",
          "Sindhi",
          "Balochi",
        ],
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ProfileSummary = mongoose.model("ProfileSummary", profileSummarySchema);
