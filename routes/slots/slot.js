import {Router} from 'express';
import authPatient from '../../middleware/patientAuthMiddleware.js';
import { bookSlot, getAvailableSlots } from '../../controllers/slots/slots.js';

const route  = Router();


route.get("/get" , getAvailableSlots)
route.post("/book" , authPatient, bookSlot)





export default route ;