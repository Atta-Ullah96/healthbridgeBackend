import { Router } from 'express'
import { adminDashboardOverview, adminLogin, adminLogout, adminRegister, banDoctor, cancelAppointmentByAdmin, completeAppointmentByAdmin, confirmAppointmentByAdmin, createLaboratory, createRole, deleteAdmin, deleteDoctor, deletePatientByAdmin, getAllAppointmentsAdmin, getAllDoctorPayouts, getAllDoctors, getAllLaboratories, getAllLabPayouts, getAllPatientsPaginated, getAllRoles, getDoctorById, markDoctorPayoutPaid, markLabPayoutPaid, unbanDoctor, updateRole, verifyDoctor } from '../../controllers/admin/admin.js'
import { adminAuth } from '../../middleware/adminMiddleware.js'
import { authorizeRoles } from '../../middleware/authorizeRoles.js'

const router = Router()


//***************************  Admin Auth routes start here   ********************* *//
router.post("/register", adminRegister),
router.post("/login", adminLogin),
router.post("/logout", adminAuth, adminLogout)
//***************************  Admin Auth routes end here   ********************* *//

//***************************  Admin dashboard  routes start here   ********************* *//
router.get("/dashboard/overview",adminAuth,authorizeRoles("owner" , "admin" , "viewer") , adminDashboardOverview);

//***************************  Admin dashboard  routes end here   ********************* *//


//***************************  Admin doctor  routes start here   ********************* *//
router.get("/doctors", adminAuth,authorizeRoles("owner" , "admin" , "viewer"),  getAllDoctors);
router.get("/doctor/:id", adminAuth, authorizeRoles("owner" , "admin"), getDoctorById);
router.patch("/doctors/:doctorId/verify", adminAuth,authorizeRoles("owner" , "admin"), verifyDoctor);
router.patch("/doctors/:doctorId/ban", adminAuth,authorizeRoles("owner" , "admin"), banDoctor);
router.patch("/doctors/:doctorId/unban", adminAuth,authorizeRoles("owner" , "admin"), unbanDoctor);
router.delete("/doctors/:doctorId", adminAuth,authorizeRoles("owner" , "admin"), deleteDoctor);
//***************************  Admin doctor  routes end here   ********************* *//

//***************************  Admin patient  routes start here   ********************* *//
router.get("/patients",adminAuth,authorizeRoles("owner" , "admin" , "viewer"), getAllPatientsPaginated);

router.delete("/patients/:patientId",adminAuth,authorizeRoles("owner" , "admin"),deletePatientByAdmin);
//***************************  Admin patient  routes end here   ********************* *//


//***************************  Admin appointment  routes start here   ********************* *//
router.get( "/appointments",adminAuth,authorizeRoles("owner" , "admin" , "viewer"  , "manager"), getAllAppointmentsAdmin);

router.patch("/appointments/:id/cancel",adminAuth,authorizeRoles("owner" , "admin" , "manager"),cancelAppointmentByAdmin);
router.patch("/appointments/:id/confirm",adminAuth,authorizeRoles("owner" , "admin" , "manager") , confirmAppointmentByAdmin);
router.patch("/appointments/:id/complete",adminAuth,authorizeRoles("owner" , "admin" , "manager") , completeAppointmentByAdmin);
//***************************  Admin appointment  routes end here   ********************* *//

//***************************  Admin laboratory's  routes start here   ********************* *//
router.post("/laboratory" , adminAuth,authorizeRoles("owner" , "admin" , "manager"), createLaboratory)
router.get("/laboratory" , adminAuth,authorizeRoles("owner" , "admin" , "manager"), getAllLaboratories)
router.put("/laboratories/:id" , adminAuth ,authorizeRoles("owner" , "admin" , "manager"), getAllLaboratories)
router.get("/lab-payouts",adminAuth,getAllLabPayouts);
router.put("/lab-payouts/:payoutId/pay",adminAuth,markLabPayoutPaid);

//***************************  Admin laboratory's  routes end here   ********************* *//

//***************************  Admin doctor payouts  routes start here   ********************* *//
router.get( "/doctor-payouts",adminAuth,getAllDoctorPayouts);
router.put("/doctor-payouts/:payoutId/pay",adminAuth,markDoctorPayoutPaid);

//***************************  Admin doctor payouts  routes end here   ********************* *//

//***************************  user creation   routes strt here   ********************* *//
router.post("/create/role" , adminAuth , authorizeRoles("owner") , createRole)
router.get("/get/role" , adminAuth , authorizeRoles("owner") , getAllRoles)
router.patch("/:id", authorizeRoles("owner"), updateRole);
router.delete("/:id", authorizeRoles("owner"), deleteAdmin);
//***************************  user creation   routes end here   ********************* *//

export default router