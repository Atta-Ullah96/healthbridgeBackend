import { Router } from 'express'
import { adminDashboardOverview, adminLogin, adminLogout, adminRegister, banDoctor, cancelAppointmentByAdmin, createLaboratory, deletePatientByAdmin, getAllAppointmentsAdmin, getAllDoctorPayouts, getAllDoctors, getAllLaboratories, getAllLabPayouts, getAllPatientsPaginated, markDoctorPayoutPaid, markLabPayoutPaid, unbanDoctor, verifyDoctor } from '../../controllers/admin/admin.js'
import { auth } from '../../middleware/auth.js'

const router = Router()


//***************************  Admin Auth routes start here   ********************* *//
router.post("/register", adminRegister),
router.post("/login", adminLogin),
router.post("/logout", auth(["admin"]), adminLogout)
//***************************  Admin Auth routes end here   ********************* *//

//***************************  Admin dashboard  routes start here   ********************* *//
router.get("/dashboard/overview",auth(["admin"]),adminDashboardOverview);

//***************************  Admin dashboard  routes end here   ********************* *//


//***************************  Admin doctor  routes start here   ********************* *//
router.get("/doctors", auth(["admin"]), getAllDoctors);
router.patch("/doctors/:doctorId/verify", auth(["admin"]), verifyDoctor);
router.patch("/doctors/:doctorId/ban", auth(["admin"]), banDoctor);
router.patch("/doctors/:doctorId/unban", auth(["admin"]), unbanDoctor);
//***************************  Admin doctor  routes end here   ********************* *//

//***************************  Admin patient  routes start here   ********************* *//
router.get("/patients",auth(["admin"]), getAllPatientsPaginated);

router.delete("/patients/:patientId",auth(["admin"]),deletePatientByAdmin);
//***************************  Admin patient  routes end here   ********************* *//


//***************************  Admin appointment  routes start here   ********************* *//
router.get( "/appointments",auth(["admin"]),getAllAppointmentsAdmin);

router.patch("/appointments/:id/cancel",auth(["admin"]),cancelAppointmentByAdmin);
//***************************  Admin appointment  routes end here   ********************* *//

//***************************  Admin laboratory's  routes start here   ********************* *//
router.post("/laboratories" , auth(["admin"] , createLaboratory))
router.get("/laboratories" , auth(["admin"] , getAllLaboratories))
router.put("/laboratories/:id" , auth(["admin"] , getAllLaboratories))
router.get("/lab-payouts",auth(["admin"]),getAllLabPayouts);
router.put("/lab-payouts/:payoutId/pay",auth(["admin"]),markLabPayoutPaid);

//***************************  Admin laboratory's  routes end here   ********************* *//

//***************************  Admin doctor payouts  routes start here   ********************* *//
router.get( "/doctor-payouts",auth(["admin"]),getAllDoctorPayouts);
router.put("/doctor-payouts/:payoutId/pay",auth(["admin"]),markDoctorPayoutPaid);

//***************************  Admin doctor payouts  routes end here   ********************* *//

export default router