// models/ProfessionalDetails.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true, // one record per doctor
    },

    city: {
      type: String,
      required: true,
    },

    clinicName: {
      type: String,
      required: true,

    },

    address: {
      type: String,
      required: true,
    },

    mapLink: {
      type: String,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Location = mongoose.model(
  "Location",
  locationSchema
);
