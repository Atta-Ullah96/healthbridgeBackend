import { Admin } from "../models/admin/admin.js";
import Doctor from "../models/doctor/doctor.js";
import { Patient } from "../models/patient/patient.js";
import Session from "../models/session.js";

export const auth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const sessionId = req.cookies.sessionId;

      if (!sessionId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(401).json({ message: "Session expired" });
      }

      // Role access check
      if (allowedRoles.length && !allowedRoles.includes(session.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      let user;

      // 🔹 Doctor check
      if (session.role === "doctor") {
        user = await Doctor.findById(session.userId);

        if (!user) {
          return res.status(401).json({ message: "Doctor not found" });
        }

        if (user.isBanned) {
          return res.status(403).json({
            message: "Your account is banned. Contact admin."
          });
        }
      }

      // 🔹 Patient check
      if (session.role === "patient") {
        user = await Patient.findById(session.userId);

        if (!user) {
          return res.status(401).json({ message: "Patient not found" });
        }
      }

      // 🔹 Admin check
      if (session.role === "admin") {
        user = await Admin.findById(session.userId);

        if (!user) {
          return res.status(401).json({ message: "Admin not found" });
        }
      }

      // Attach data for controllers
      req.userId = user._id;
      req.role = session.role;

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Authentication error" });
    }
  };
};