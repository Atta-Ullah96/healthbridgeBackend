import mongoose from "mongoose";
import { DB_URL, DEVELOPING_DB_URL } from "./config.js"; 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DEVELOPING_DB_URL || DB_URL );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Exit process if connection fails
  }
};

export default connectDB;
