import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor"
      
    },
   patientId :  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient"
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, // expires in 7 days
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
