import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  roles:[ {
    type: String,
    enum: ["owner", "admin", "manager", "viewer"],
    default: "owner"
  }]
}, { timestamps: true });



adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//
// ✅ Compare password method
//
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Admin = mongoose.model("ADMIN", adminSchema)
