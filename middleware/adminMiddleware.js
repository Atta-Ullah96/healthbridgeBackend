import { Admin } from "../models/admin/admin.js";
import Session from "../models/session.js";

export const adminAuth = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (!sessionId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = await Session.findById({_id: sessionId});
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ message: "Session expired" });
  }


  const admin = await Admin.findById(session.userId);

  if(!admin){
      return res.status(403).json({ message: "Forbidden" });
  }

  req.admin = admin;
  next();
};
