import {Router} from 'express';
import { createAppointment, getPatientAppointments, loginPatient, logoutPatient, registerPatient } from '../../controllers/patient/patient.js';
import authPatient from '../../middleware/patientAuthMiddleware.js';
const route  = Router();




route.post("/register" , registerPatient)
route.post("/login" , loginPatient)
route.post("/logout" , authPatient ,logoutPatient )

route.post("/book-appointment", authPatient, createAppointment);
route.get("/get-appointment", authPatient, getPatientAppointments);


export default route ;