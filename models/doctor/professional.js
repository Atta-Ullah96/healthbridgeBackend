// models/ProfessionalDetails.js
import mongoose from "mongoose";

const professionalDetailsSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true, // one record per doctor
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },

    pmcNumber: {
      type: String,
      required: true,
      trim: true,
    },

    qualification: {
      type: String,
      required: true,
      trim: true,
    },

    institute: {
      type: String,
      required: true,
      trim: true,
    },

    graduationYear: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear(),
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    
  },
  { timestamps: true }
);

export const ProfessionalDetails = mongoose.model(
  "ProfessionalDetails",
  professionalDetailsSchema
);
