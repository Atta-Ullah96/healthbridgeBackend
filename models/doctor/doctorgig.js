import mongoose  from "mongoose";

const doctorGigSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  serviceTitle: { type: String },
 
  description: { type: String},
  consultationFee: { type: Number },
  duration: { type: Number },
  profileImage: { type: String }, // URL to uploaded image
  createdAt: { type: Date, default: Date.now }
});

export const  DoctorGig =  mongoose.model("DoctorGig", doctorGigSchema);
