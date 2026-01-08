import { Appointment } from "../../models/appointements/appointements.js";
import { generateAgoraToken } from "../../services/videocallService.js";


export const generateVideoCallToken = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId).populate("slotId");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // authorization (doctor or patient)
    const userId = req.doctor?._id || req.patient?._id;

    if (
      req.doctor &&
      appointment.doctorId.toString() !== req.doctor._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized doctor" });
    }

    if (
      req.patient &&
      appointment.patientId.toString() !== req.patient._id.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized patient" });
    }

    // appointment state check
    if (appointment.paymentStatus !== "paid" || appointment.status !== "confirmed") {
      return res.status(400).json({ message: "Appointment not ready for video call" });
    }

    // time validation
    const now = new Date();
    const slot = appointment.slotId;

    const slotDate = new Date(slot.date);
    const [startH, startM] = slot.startTime.split(":");
    const [endH, endM] = slot.endTime.split(":");

    const startTime = new Date(slotDate);
    startTime.setHours(startH, startM, 0);

    const endTime = new Date(slotDate);
    endTime.setHours(endH, endM, 0);

    if (now < startTime || now > endTime) {
      return res.status(400).json({ message: "Video call not allowed at this time" });
    }

    // agora token
    const channelName = `appointment_${appointment._id}`;
    const uid = Number(userId.toString().slice(-6));

    const role = req.doctor ? "PUBLISHER" : "SUBSCRIBER";

    const token = generateAgoraToken({
      appId: process.env.AGORA_APP_ID,
      appCertificate: process.env.AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role: role === "PUBLISHER" ? 1 : 2
    });

    res.status(200).json({
      token,
      channelName,
      uid
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
