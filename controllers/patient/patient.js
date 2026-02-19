
import { Patient } from "../../models/patient/patient.js";
import { asyncHandler } from '../../utils/asyncHandler.js'
import Session from "../../models/session.js";
import { Appointment } from "../../models/appointements/appointements.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { MedicalRecord } from "../../models/doctor/medicalrecord.js";
import { AGORA_APP_ID } from "../../config/config.js";
import { canJoinCall } from "../../utils/canjoincall.js";
import { generateAgoraToken } from "../../utils/agoraToken.js";

// Register new patient

export const registerPatient = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // 1️⃣ Check if patient already exists
    let patient = await Patient.findOne({ email });

    if (!patient) {
      patient = await Patient.create({
        name,
        email,
        phone,
        isPasswordSet: false,
      });
    }

    // 2️⃣ Create or refresh session
    let session = await Session.findOne({
      userId: patient._id,
      role: "patient",
    });

    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + ttlMs);

    if (!session) {
      session = await Session.create({
        userId: patient._id, // ✅ FIXED
        role: "patient",
        expiresAt,
      });
    } else {
      session.expiresAt = expiresAt;
      await session.save();
    }

    // 3️⃣ Set cookie
    res.cookie("sessionId", session._id.toString(), {
      httpOnly: true,
      sameSite: "lax",
      // secure: true (enable in production https)
    });

    res.status(200).json({
      message: "Authenticated successfully",
      patientId: patient._id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Login patient
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");

    await Session.create({
      userId: patient._id,
      roleModel: "Patient",
      sessionToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("sessionId", sessionToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// logout sessions
export const logoutPatient = asyncHandler(async (req, res) => {
  const { sessionId } = req.cookies;

  // The middleware already ensures sessionId is valid
  await Session.findByIdAndDelete(sessionId);

  // Clear cookie
  res.clearCookie("sessionId");

  res.status(200).json({
    success: true,
    message: "Patient logged out successfully",
  });
});



export const getCurrentPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId)
      .select("-__v"); // hide unnecessary fields

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      patient,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


//******************************Appointment Apis started from here************************************ *//


//create appointment by paitent  //
export const createAppointment = asyncHandler(async (req, res) => {

  const { doctor, date, timeSlot, reason } = req.body;

  // req.user.id comes from patient auth middleware
  const appointment = new Appointment({
    patient: req.userId, // patient id
    doctor,
    date,
    timeSlot,
    reason,
  });

  await appointment.save();
  res.status(201).json({ success: true, message: "Appointment created successfully" });




});



// paitnet can see thier appointmetn //


export const getPatientAppointments = asyncHandler(async (req, res) => {

  const appointments = await Appointment.find({ patientId: req.userId })
    .populate("doctorId", "name ").populate("slotId", "startTime") // fetch doctor details
    .sort({ date: 1 });
  const result = appointments?.map(app => ({
    ...app.toObject(),
    canJoinCall: canJoinCall(app?.slotId, app?.selectedDate)
  }));

  if (!appointments) {
    return next(new ErrorHandler("Appointments not found", 401))
  }

  res.status(200).json({ success: true, result });



});

// ***************** appointemnt apis end here ******************* //

// ***************** medical record  apis start here ******************* //

/**
 * @desc    Get patient medical records
 * @route   GET /api/records/:patientId
 * @access  Doctor/Patient
 */
export const getMedicalRecords = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;

  const records = await MedicalRecord.find({ patient: patientId }).populate("doctor", "name specialization");

  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

// ***************** medical record  apis end here ******************* //



export const joinVideoCallByPatient = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  // Security check
  if (
    appointment.patientId.toString() !== userId.toString()
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (appointment.status !== "confirmed") {
    return res.status(400).json({ message: "Appointment not confirmed" });
  }

  const channelName = `appointment_${appointment._id}`;
  const token = generateAgoraToken(channelName, userId);

  res.json({
    appId: AGORA_APP_ID,
    token,
    channelName,
    uid: userId,
  });
}

