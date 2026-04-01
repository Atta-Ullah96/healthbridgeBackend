import serverless from 'serverless-http'
import app from './app.js';
// **************************** database connection start ************* // 
import connectDB from './config/db.js';
connectDB()


export const handler = serverless(app); 