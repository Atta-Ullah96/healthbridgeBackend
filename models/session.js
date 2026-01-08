import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
 {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  role: {
    type: String,
    enum: ["doctor", "patient", "admin" , "laboratory"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // 7 days
  }
},
  { timestamps: true },
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;




