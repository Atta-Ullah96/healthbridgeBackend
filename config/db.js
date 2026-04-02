import mongoose from "mongoose";
import { PROD_DB_URL  , DEV_DB_URL} from "./config.js";


const isProduction = process.env.NODE_ENV === 'production';
 const dbUrl = isProduction ? PROD_DB_URL : DEV_DB_URL;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbUrl);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Exit process if connection fails
  }
};

export default connectDB;
