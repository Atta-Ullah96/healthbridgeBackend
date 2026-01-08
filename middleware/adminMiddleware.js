import { Admin } from "../models/admin/admin.js";
import Session from "../models/session.js";

export const adminAuth = async (req, res, next) => {
  const sessionId = req.cookies.adminSessionId;

  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = await Session.findById(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Session expired" });
  }


  const admin = await Admin.findById(session.adminId);

  if(!admin){
      return res.status(403).json({ message: "Forbidden" });
  }

  req.admin = admin;
  next();
};
