import { Appointment } from "../../models/appointements/appointements.js";
import Doctor from "../../models/doctor/doctor.js";
import { Notification } from "../../models/notifaction/notifaction.js";
import { Review } from "../../models/review/review.js";


export const createReview = async (req, res) => {
  try {
    const patientId = req.patient._id;
    const { appointmentId, rating, comment } = req.body;

    // appointment check
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (appointment.patientId.toString() !== patientId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (appointment.status !== "completed")
      return res.status(400).json({ message: "Appointment not completed yet" });

    // prevent duplicate review
    const alreadyReviewed = await Review.findOne({ appointmentId });
    if (alreadyReviewed)
      return res.status(400).json({ message: "Review already submitted" });

    // create review
    const review = await Review.create({
      doctorId: appointment.doctorId,
      patientId,
      appointmentId,
      rating,
      comment
    });

    // update doctor rating
    const doctor = await Doctor.findById(appointment.doctorId);

    doctor.totalReviews += 1;
    doctor.averageRating =
      (doctor.averageRating * (doctor.totalReviews - 1) + rating) /
      doctor.totalReviews;

    await doctor.save();

    // notify doctor
    await Notification.create({
      doctorId: doctor._id,
      role: "doctor",
      title: "New Review Received",
      message: `You received a ${rating}-star review from a patient.`,
      type: "review"
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// get doctor review 
export const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const reviews = await Review.find({ doctorId })
      .populate("patientId", "fullName")
      .sort({ createdAt: -1 });

    res.json({ reviews });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
