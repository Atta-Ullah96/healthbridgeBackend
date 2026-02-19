import   {Router} from 'express'
import { createAppointment, verifyAppointment} from '../../controllers/appointment/appointment.js';
import { generateVideoCallToken } from '../../controllers/appointment/videoCall.js';
import { auth } from '../../middleware/auth.js';
const router = Router()




router.post("/create" , auth(["patient"]) , createAppointment)
router.get("/verify" , auth(["patient"]) , verifyAppointment)
router.get(
  "/appointments/:appointmentId/video-token",

  generateVideoCallToken
);

router.get(
  "/appointments/:appointmentId/video-token",

  generateVideoCallToken
);





export default router;