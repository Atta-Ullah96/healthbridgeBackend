import { Router } from "express";
import { acceptAppointment, addMedicalRecord, completeAppointment, completeUpload, createBankDetails,  createOrUpdateAvailability, deleteBankDetails,getAvailability,getAvailabilityForBook,getBankDetails, getBasicInfo, getConsultationSetup, getDoctorAppointments, getDoctorConfirmedAppointments, getDoctorDocuments, getDoctorEarnings, getDoctorOverview, getDoctorPatients, getDoctorProfile, getDoctors, getDocumentViewUrl,   getLocation,   getProfessionalDetails,  getProfileCompletion,  getProfileSummary,  initiateUpload,  joinVideoCallByDoctor,  loginDoctor, loginWithGoogle, logoutDoctor, me, registerDoctor, rejectAppointment, updateBankDetails, updateBasicInfo,  updateLocation,  updateProfessionalDetails, updateProfileSummary, upsertConsultationSetup } from "../../controllers/doctor/doctor.js";

import { upload } from "../../middleware/multer.js";
import { auth } from "../../middleware/auth.js";


const router  = Router();




//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis start ^^^^^^^^^^^^^^^^^^ //

router.get("/me" , auth(["doctor"]) , me)
router.post("/register" , upload.single("pmcCertificate"),registerDoctor)
router.post("/login" , loginDoctor)
router.post("/logout" , auth(["doctor"]) , logoutDoctor)
router.post("/auth/google" , loginWithGoogle)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ authentication apis end ^^^^^^^^^^^^^^^^^^ //
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile start from here  ^^^^^^^^^^^^^^^^^^ //
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 1 basic info start   ^^^^^^^^^^^^^^^^^^ //

router.post("/initiate/upload" , auth(["doctor"]) , initiateUpload)
router.post("/complete/upload" , auth(["doctor"]) , completeUpload)
router.post("/basic-info" , auth(["doctor"]) , updateBasicInfo)
router.get("/basic-info" , auth(["doctor"]) , getBasicInfo)

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 1 basic info end   ^^^^^^^^^^^^^^^^^^ //

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 2 professional Details start  here ^^^^^^^^^^^^^^^^^^ //
router.get("/professional-details" , auth(["doctor"]) , getProfessionalDetails)
router.put("/professional-details" , auth(["doctor"]) , updateProfessionalDetails)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 2 professional Details ends here   ^^^^^^^^^^^^^^^^^^ //

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 3 profile Summary Details start here   ^^^^^^^^^^^^^^^^^^ //


router.get("/profile-summary",auth(["doctor"]),getProfileSummary);
router.put("/profile-summary",auth(["doctor"]),updateProfileSummary);

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 3 profileSummary Details ends here   ^^^^^^^^^^^^^^^^^^ //
router.get("/profile-complete",auth(["doctor"]), getProfileCompletion);

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 4 document  start  here  ^^^^^^^^^^^^^^^^^^ //
router.get("/view-url/:purpose", auth(["doctor"]), getDocumentViewUrl);
router.get("/uploads/documents", auth(["doctor"]), getDoctorDocuments);

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 4 document  end  here  ^^^^^^^^^^^^^^^^^^ //
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 5 consultation  start  here  ^^^^^^^^^^^^^^^^^^ //
router.get("/consultation",auth(["doctor"]), getConsultationSetup);
router.post("/consultation", auth(["doctor"]), upsertConsultationSetup);
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 5 consultation  end  here  ^^^^^^^^^^^^^^^^^^ //

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 6 Availability  start  here  ^^^^^^^^^^^^^^^^^^ //
router.post("/availability" , auth(["doctor"]) , createOrUpdateAvailability)
router.get("/availability" , auth(["doctor"]) , getAvailability)
router.get("/availability/:doctorId"  , getAvailabilityForBook)
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 6 Availability  end  here  ^^^^^^^^^^^^^^^^^^ //

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 7 location  start  here  ^^^^^^^^^^^^^^^^^^ //
router.get("/location",auth(["doctor"]), getLocation);
router.post("/location",auth(["doctor"]), updateLocation);
//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile section 7 location  end  here  ^^^^^^^^^^^^^^^^^^ //

//^^^^^^^^^^^^^^^^^^^^^^^^^^^ doctor profile end  here  ^^^^^^^^^^^^^^^^^^ //

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

// *************************** get doctor  start  ************************ //
router.get("/doctors" , getDoctors)
router.get(`/profile/:doctorId` , getDoctorProfile)
// *************************** get doctor end  ************************ //

// *************************** join a video call start  ************************ //
router.post("/appointment/:id/join-call" , auth(["doctor"]) , joinVideoCallByDoctor)
// *************************** join a video call  end  ************************ //




export default router ;