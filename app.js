import { ADMIN_HEALTHBRIDGE_DOMAIN, HEALTHBIRDGE_DOMAIN, PORT } from './config/config.js';
import { CalculatedGithubWebhookSignature } from './utils/verifygithubwebhooksignature.js';
import express from 'express';
const app = express();
import errorHandler from './middleware/errorMiddleware.js';
import cookieParser from 'cookie-parser';
import { stripeWebhook } from './controllers/appointment/appointment.js';
import { labStripeWebhook } from './controllers/laboratory/laboratory.js';
import cors from 'cors'
// import  cron from 'node-cron'
// import Doctor from './models/doctor/doctor.js';
// import { generateSlots } from './utils/slotGenerator.js';




const allowedOrigins = [
HEALTHBIRDGE_DOMAIN,
ADMIN_HEALTHBRIDGE_DOMAIN,

];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true // if using cookies / sessions
  })
);


//stripe webhook endipoint 

app.post("/api/v1/appointment/verify" , express.raw({ type: "application/json" }),  stripeWebhook)
app.post("/api/v1/lab/verify" , express.raw({ type: "application/json" }),  labStripeWebhook)
app.post(
  '/github/webhook',
  express.raw({ type: 'application/json' }), // raw body for signature verification
  (req, res) => {
    // Step 1: Verify signature
    if (!CalculatedGithubWebhookSignature(req)) {
      console.log('⚠️ Signature verification failed');
      return res.status(401).send('Invalid signature');
    }

    // Step 2: Parse payload
    const payload = JSON.parse(req.body.toString());
    const repo = payload.repository.full_name;
    const branch = payload.ref; // e.g., "refs/heads/main"
    const commit = payload.head_commit?.id || 'unknown';

    console.log(`✅ Webhook received for ${repo} on ${branch}, commit ${commit}`);

    // Step 3: Respond immediately to GitHub
    res.status(200).send('Webhook received');

    // Step 4: Check branch rules (only deploy main branch)
    if (branch !== 'refs/heads/main') {
      console.log('⏭ Branch is not main, skipping deployment');
      return;
    }

    // Step 5: Spawn deployment script
    const deploy = spawn('bash', ['/home/ubuntu/backend-deploy.sh']);

    deploy.stdout.on('data', (data) => {
      console.log(`stdout: ${data.toString()}`);
    });

    deploy.stderr.on('data', (data) => {
      console.error(`stderr: ${data.toString()}`);
    });

    deploy.on('close', (code) => {
      console.log(`Deployment finished with code ${code}`);
      // ✅ Here you can call GitHub Commit Status API or send email
    });

    deploy.on('error', (err) => {
      console.error('Failed to start deployment:', err);
      // ⚠️ Send email notification here
    });
  }
);


app.use(express.json())
app.use(express.urlencoded({extended:true}))




app.use(cookieParser(process.env.SIGNED_COOKIE_SECRET_KEY ))

// **************************** database connection start ************* // 
import connectDB from './config/db.js';
connectDB()
// **************************** database connection end ************* // 

// **************************** slot function  start ************* //


// **************************** slot function end here  ************* // 


// testing api 

app.get("/" , (req ,res) =>{
    res.end("tesing api")
})

// **************************** doctor api's start ************* // 
import doctorRoute from './routes/doctor/doctor.js';
app.use("/api/v1/doctor" , doctorRoute)
// **************************** doctor apis end ************* // 

// **************************** patient routes start ************* // 
import patientRoute from './routes/patient/patient.js';

app.use("/api/v1/patient" , patientRoute)
// **************************** Patient routes end ************* // 

// **************************** slots routes start ************* // 
import slot from './routes/slots/slot.js';

app.use("/api/v1/slot" , slot)
// **************************** slots routes end ************* // 
// **************************** appointments routes start ************* // 
import appointment from './routes/appointment/appointment.js'

app.use("/api/v1/appointment" , appointment)
// **************************** appointments routes end ************* // 



// **************************** review routes start ************* // 
import review from './routes/review/review.js'

app.use("/api/v1/review" , review)
// **************************** review routes end ************* // 

// **************************** laboratory routes start ************* // 

import Laboratory from './routes/laboratory/laboratory.js';
app.use("/api/v1/laboratory" , Laboratory)

// **************************** laboratory routes end ************* //

// **************************** admin routes start ************* // 
import admin from './routes/admin/admin.js'
import { zodErrorHandler } from './middleware/zodErrorMiddleware.js';



app.use("/api/v1/admin" , admin)
// **************************** admin routes end ************* // 


app.use(zodErrorHandler);
app.use(errorHandler)

app.listen(PORT , () =>{
    console.log("server is running on port number 4000")
})
