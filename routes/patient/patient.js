import {Router} from 'express';
import { createAppointment, getCurrentPatient, getPatientAppointments, joinVideoCallByPatient, loginPatient, logoutPatient, registerPatient } from '../../controllers/patient/patient.js';
import {auth} from '../../middleware/auth.js';
const route  = Router();




route.post("/register" , registerPatient)
route.post("/login" , loginPatient)
route.post("/logout" , auth(["patient"]) ,logoutPatient )

route.get("/me", auth(["patient"]), getCurrentPatient);

route.post("/book-appointment", auth(["patient"]), createAppointment);
route.get("/get-appointment", auth(["patient"]), getPatientAppointments);

// *************************** join a video call start  ************************ //
route.post("/appointment/:id/join-call" , auth(["patient"]) , joinVideoCallByPatient)
// *************************** join a video call  end  ************************ //
export default route ;