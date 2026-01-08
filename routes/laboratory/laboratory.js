import express from "express";
import { createLabOrder, createLabTest, createTechnician, deleteCompletedOrder, deleteLabTest, deleteTechnician, getAllLabTests, getAllTechnicians, getLabOrders, getMyLabPayouts, getMyLabTests, labDashboardOverview, laboratoryLogin, updateLabTest, updateOrderStatus, updateTechnician } from "../../controllers/laboratory/laboratory.js";
import { auth } from "../../middleware/auth.js";


const router = express.Router();



// ************************ login routes start here ************************ //
router.post("/login" , laboratoryLogin)
// ************************ login routes end here ************************ //

// ************************ overview routes start here ************************ //

router.get("/overivew" , auth(["laboratory"]) , labDashboardOverview)
// ************************ overview routes end here ************************ //

// ************************ order routes start here ************************ //
// order will be created by patient
router.post("/create/order" , auth(["patient"]) , createLabOrder )
router.get("/get" , auth(["laboratory"]) , getLabOrders)
router.put("/:id" , auth(["laboratory"]) , updateOrderStatus)
router.delete("/:id" , auth(["laboratory"]) , deleteCompletedOrder) 

// ************************ order routes end here ************************ //

// ************************ labTest routes start here ************************ //

router.get("/test" , auth(["laboratory"]) , getMyLabTests)
router.get("/test"  , getAllLabTests)
router.post("/test/create" , auth(["laboratory"]) , createLabTest)
router.put("/test/:id" , auth(["laboratory"]) , updateLabTest)
router.delete("/test/:id" , auth(["laboratory"]) , deleteLabTest)

// ************************ labTest routes end here ************************ //


// ************************ Technician routes start here ************************ //
router.post("/technician/", auth([ "laboratory"]), createTechnician);
router.get("/technician/", auth([ "laboratory"]), getAllTechnicians);
router.put("/technician/:id", auth([ "laboratory"]), updateTechnician);
router.delete("/technician/:id", auth([ "laboratory"]), deleteTechnician);
// ************************ Technician routes end here ************************ //

// ************************ payout routes start here ************************ //
router.get("/payouts",auth(["laboratory"]),getMyLabPayouts);

// ************************ payout routes end here ************************ //


export default router;
