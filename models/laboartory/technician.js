import mongoose  from "mongoose";
const technicianSchema = new mongoose.Schema({
  laboratoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },

  name: String,
  phone: String,
  email: String,

  isActive: { type: Boolean, default: true }
});

export const Technician = mongoose.model("Technician" , technicianSchema)
