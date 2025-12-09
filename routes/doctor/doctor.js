import { Router } from "express";
import { addMedicalRecord, createBankDetails, createGig, createOrUpdateAvailability, createSlot, deleteBankDetails, deleteGig,  getAvailableSlots, getBankDetails, getConfirmedAppointments, getDoctorAppointments, getDoctorEarnings, getDoctorOverview, getDoctorPatients, getMyGigs,  loginDoctor, logoutDoctor, registerDoctor, updateAppointmentStatus, updateBankDetails, updateGig } from "../../controllers/doctor/doctor.js";
import authDoctor from "../../middleware/doctorAuthMiddleware.js";
import { upload } from "../../middleware/multer.js";
import authPatient from "../../middleware/patientAuthMiddleware.js";

const router  = Router();




//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis start ^^^^^^^^^^^^^^^^^^ //

router.post("/register" , upload.single("pmcCertificate"),registerDoctor)
router.post("/login" , loginDoctor)
router.post("/logout" , authDoctor , logoutDoctor)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis start ^^^^^^^^^^^^^^^^^^ //


// ************************** Availability apis start from here ************* //
router.post("/availability" , authDoctor , createOrUpdateAvailability)
// ************************** Availability apis end from here ************* //


// *************************** Appointments start  ************************ //
router.get("/appointments/all" , authDoctor , getDoctorAppointments)
router.get("/appointments/confirmed", authDoctor, getConfirmedAppointments);
router.patch("/appointments/:appointmentId/status", authDoctor, updateAppointmentStatus);

// *************************** Appointments end  ************************ //

// *************************** Patients  start  ************************ //

router.get("/patients", authDoctor, getDoctorPatients);
// *************************** Patients  end  ************************ //

// *************************** gig  start  ************************ //
router.post("/gig", authDoctor, upload.single("profileImage"), createGig);
router.get("/gig", authDoctor, getMyGigs);
router.put("/gig/:id", upload.single("profileImage") ,authDoctor, updateGig);
router.delete("/gig/:id", authDoctor, deleteGig);
// *************************** gig  end  ************************ //


// *************************** slot  start  ************************ //

router.post("/create",   authDoctor , createSlot);
router.get("/get",  authPatient , getAvailableSlots);

// *************************** slot  end  ************************ //



// *************************** bank  start  ************************ //
router.post("/bank", authDoctor, createBankDetails);  // Create
router.put("/bank", authDoctor, updateBankDetails);  // Update
router.get("/bank", authDoctor, getBankDetails);     // Get
router.delete("/bank", authDoctor, deleteBankDetails); 
// *************************** bank  end  ************************ //

// *************************** earning  start  ************************ //

router.get("/earnings", authDoctor , getDoctorEarnings);

// *************************** earning  end  ************************ //

// *************************** overview  start  ************************ //

router.get("/overview", authDoctor , getDoctorOverview);

// *************************** overview  end  ************************ //

// *************************** medical  record start  ************************ //

router.post("/", authDoctor, addMedicalRecord);
// *************************** medical  record end  ************************ //




export default router ;