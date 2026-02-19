import mongoose from "mongoose";

const doctorBasicInfoSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      unique: true,
      
    },

    firstName: {
      type: String,
      trim: true,
      required: true,
    },

    lastName: {
      type: String,
      trim: true,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      
    },

    dob: {
      type: Date,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    profileImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const DoctorBasicInfo =  mongoose.model("DoctorBasicInfo", doctorBasicInfoSchema);
