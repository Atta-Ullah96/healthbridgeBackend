import {Router} from 'express';
import { createAppointment, getPatientAppointments, loginPatient, logoutPatient, registerPatient } from '../../controllers/patient/patient.js';
import {auth} from '../../middleware/auth.js';
const route  = Router();




route.post("/register" , registerPatient)
route.post("/login" , loginPatient)
route.post("/logout" , auth(["patient"]) ,logoutPatient )

route.post("/book-appointment", auth(["patient"]), createAppointment);
route.get("/get-appointment", auth(["patient"]), getPatientAppointments);


export default route ;