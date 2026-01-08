import { Router } from "express";
import { acceptAppointment, addMedicalRecord, completeAppointment, createBankDetails, createGig, createOrUpdateAvailability, deleteBankDetails, deleteGig ,getAvailability,getBankDetails, getDoctorAppointments, getDoctorConfirmedAppointments, getDoctorEarnings, getDoctorOverview, getDoctorPatients, getMyGigs,  loginDoctor, logoutDoctor, registerDoctor, rejectAppointment, updateBankDetails, updateGig } from "../../controllers/doctor/doctor.js";

import { upload } from "../../middleware/multer.js";
import { auth } from "../../middleware/auth.js";


const router  = Router();




//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis start ^^^^^^^^^^^^^^^^^^ //

router.post("/register" , upload.single("pmcCertificate"),registerDoctor)
router.post("/login" , loginDoctor)
router.post("/logout" , auth(["doctor"]) , logoutDoctor)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis start ^^^^^^^^^^^^^^^^^^ //


// ************************** Availability apis start from here ************* //
router.post("/availability" , auth(["doctor"]) , createOrUpdateAvailability)
router.get("/availability" , auth(["doctor"]) , getAvailability)
// ************************** Availability apis end from here ************* //


// *************************** Appointments start  ************************ //
router.get("/appointments/all" , auth(["doctor"]) , getDoctorAppointments)
router.get("/appointments/confirmed", auth(["doctor"]), getDoctorConfirmedAppointments);
router.patch("/appointments/:appointmentId/accept" , auth(["doctor"]) , acceptAppointment)
router.patch("/appointments/:appointmentId/reject" , auth(["doctor"]) , rejectAppointment)
router.patch("/appointments/:appointmentId/complete" , auth(["doctor"]) , completeAppointment)

// *************************** Appointments end  ************************ //

// *************************** Patients  start  ************************ //

router.get("/patients", auth(["doctor"]), getDoctorPatients);
// *************************** Patients  end  ************************ //

// *************************** gig  start  ************************ //
router.post("/consultation", auth(["doctor"]), upload.single("profileImage"), createGig);
router.get("/consultation", auth(["doctor"]), getMyGigs);
router.put("/consultation/:id", upload.single("profileImage") ,auth(["doctor"]), updateGig);
router.delete("/consultation", auth(["doctor"]), deleteGig);
// *************************** gig  end  ************************ //


// *************************** bank  start  ************************ //
router.post("/bank", auth(["doctor"]), createBankDetails);  // Create
router.put("/bank", auth(["doctor"]), updateBankDetails);  // Update
router.get("/bank", auth(["doctor"]), getBankDetails);     // Get
router.delete("/bank", auth(["doctor"]), deleteBankDetails); 
// *************************** bank  end  ************************ //

// *************************** earning  start  ************************ //

router.get("/earnings", auth(["doctor"]) , getDoctorEarnings);

// *************************** earning  end  ************************ //

// *************************** overview  start  ************************ //

router.get("/overview", auth(["doctor"]) , getDoctorOverview);

// *************************** overview  end  ************************ //

// *************************** medical  record start  ************************ //

router.post("/", auth(["doctor"]), addMedicalRecord);
// *************************** medical  record end  ************************ //




export default router ;