import express from 'express';
const app = express();
import dotenv from 'dotenv';
import errorHandler from './middleware/errorMiddleware.js';
dotenv.config()
import cookieParser from 'cookie-parser';
// import  cron from 'node-cron'
// import Doctor from './models/doctor/doctor.js';
// import { generateSlots } from './utils/slotGenerator.js';



app.use(express.json())



app.use(cookieParser(process.env.SIGNED_COOKIE_SECRET_KEY ))

// **************************** database connection start ************* // 
import connectDB from './config/db.js';
connectDB()
// **************************** database connection end ************* // 

// **************************** slot function  start ************* //


// **************************** slot function end here  ************* // 


// **************************** doctor api's start ************* // 
import doctorRoute from './routes/doctor/doctor.js';
app.use("/api/v1/doctor" , doctorRoute)
// **************************** doctor apis end ************* // 

// **************************** patient routes start ************* // 
import patientRoute from './routes/patient/patient.js';

app.use("/api/v1/patient" , patientRoute)
// **************************** Patient routes end ************* // 


app.use(errorHandler)

app.listen(process.env.PORT , () =>{
    console.log("server is running on port number 4000")
})
