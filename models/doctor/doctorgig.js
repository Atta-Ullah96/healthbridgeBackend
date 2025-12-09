import mongoose  from "mongoose";

const doctorGigSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  serviceTitle: { type: String, required: true },
  specialization: { type: String, required: true },
  description: { type: String, required: true },
  consultationFee: { type: Number, required: true },
  duration: { type: Number, required: true },
  profileImage: { type: String }, // URL to uploaded image
  createdAt: { type: Date, default: Date.now }
});

export const  DoctorGig =  mongoose.model("DoctorGig", doctorGigSchema);
