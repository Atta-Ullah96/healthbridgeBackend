import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: ["payment", "appointment", "system" , "review"],
      default: "system"
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
