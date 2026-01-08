import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    medicalUniversity: {
      type: String,
      required: [true, "Medical university is required"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10,15}$/, "Please enter a valid phone number"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // hide password by default
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    pmcNumber: {
      type: String,
      required: [true, "PMC number is required"],
      unique: true,
    },
    cnicNumber: {
      type: String,
   
    },
    pmcCertificate: {
      type: String, // URL or file path
      required: [true, "PMC certificate upload is required"],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    
    isBanned : {
      type:Boolean,
      default : false,
      
    },
    isVerified:{
      type:Boolean ,
      default : false
    },
    role:{
      type:String,
      default: 'doctor'
    },
 
  },
  { timestamps: true }
);



doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔐 Compare entered password with hashed password
doctorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
