import express from "express";
import authPatient from "../../middleware/patientAuthMiddleware.js";
import { createReview, getDoctorReviews } from "../../controllers/review/review.js";


const router = express.Router();

router.post("/create", authPatient, createReview);
router.get("/doctors/:doctorId/reviews", getDoctorReviews);

export default router;