import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isPasswordSet: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);




// 🔐 Hash password before save
patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});



// 🔑 Compare password
patientSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const Patient = mongoose.model("Patient", patientSchema);
