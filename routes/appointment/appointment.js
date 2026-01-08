import   {Router} from 'express'
import authPatient from '../../middleware/patientAuthMiddleware.js';
import { createAppointment} from '../../controllers/appointment/appointment.js';
import { generateVideoCallToken } from '../../controllers/appointment/videoCall.js';
import authDoctor from '../../middleware/doctorAuthMiddleware.js';
const router = Router()




router.post("/create" , authPatient , createAppointment)
router.get(
  "/appointments/:appointmentId/video-token",
  authDoctor,
  generateVideoCallToken
);

router.get(
  "/appointments/:appointmentId/video-token",
  authPatient,
  generateVideoCallToken
);





export default router;