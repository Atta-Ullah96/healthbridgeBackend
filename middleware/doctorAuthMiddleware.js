import {asyncHandler} from "../utils/asyncHandler.js"
import ErrorHandler from "../utils/errorHandler.js";
import Session from "../models/session.js";
import Doctor from "../models/doctor/doctor.js";

const authDoctor = asyncHandler(async (req, res, next) => {
  const { doctorSessionId } = req.cookies;

  // Step 1: Check for cookie
  if (!doctorSessionId) {
    return next(new ErrorHandler("Session not found. Please log in.", 401));
  }

  // Step 2: Find session in DB
  const session = await Session.findById(doctorSessionId);
  if (!session) {
    res.clearCookie("doctorSessionId");
    return next(new ErrorHandler("Invalid or deleted session. Please log in again.", 401));
  }

  // Step 3: Check expiry (optional if TTL auto deletes)
  if (session.expiresAt && session.expiresAt < new Date()) {
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("doctorSessionId");
    return next(new ErrorHandler("Session expired. Please log in again.", 401));
  }

  // Step 4: Find the doctor using session.doctorId
  const doctor = await Doctor.findById(session.doctorId);
  if (!doctor) {
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("doctorSessionId");
    return next(new ErrorHandler("Doctor not found. Please log in again.", 404));
  }

  // Step 5: Attach doctor to req for next middleware
  req.doctor = doctor;

  // Step 6: Continue
  next();
});

export default authDoctor;
