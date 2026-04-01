import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const laboratorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },



    password: {
      type: String,
      required: true
    },



    isActive: {
      type: Boolean,
      default: true
    },

    isBanned: {
      type: Boolean,
      default: false
    },
    status:{
      type:String,
      enum: ["pending" , "Active" , "suspended"],
      default:"pending"
    }

  },
  { timestamps: true }
);

/* 🔐 Hash password */
laboratorySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* 🔑 Compare password */
laboratorySchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export const Laboratory =  mongoose.model("Laboratory", laboratorySchema);
