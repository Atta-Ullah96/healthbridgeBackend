import {asyncHandler} from "../utils/asyncHandler.js"
import ErrorHandler from "../utils/errorHandler.js";
import Session from "../models/session.js";
import {Patient} from "../models/patient/patient.js";

const authPatient  = asyncHandler(async (req, res, next) => {
  const { patientSessionId } = req.cookies;

  // Step 1: Check for cookie
  if (!patientSessionId) {
    return next(new ErrorHandler("Session not found. Please log in.", 401));
  }

  // Step 2: Find session in DB
  const session = await Session.findById(patientSessionId);
  if (!session) {
    res.clearCookie("patientSessionId");
    return next(new ErrorHandler("Invalid or deleted session. Please log in again.", 401));
  }

  // Step 3: Check expiry (optional if TTL auto deletes)
  if (session.expiresAt && session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("patientSessionId");
    return next(new ErrorHandler("Session expired. Please log in again.", 401));
  }

  // Step 4: Find the patient using session.doctorId
  const patient = await Patient.findById(session.patientId);
  if (!patient) {
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("patientSessionId");
    return next(new ErrorHandler("Patient not found. Please log in again.", 404));
  }

  // Step 5: Attach doctor to req for next middleware
  req.patient = patient;

  // Step 6: Continue
  next();
});

export default authPatient;
