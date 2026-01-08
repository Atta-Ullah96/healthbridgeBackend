import { Admin } from "../../models/admin/admin.js";
import { LabPayout } from "../../models/admin/labpayout.js";
import { Appointment } from "../../models/appointements/appointements.js";
import Doctor from "../../models/doctor/doctor.js";
import { Laboratory } from "../../models/laboartory/labartory.js";
import { Patient } from "../../models/patient/patient.js";
import { Review } from "../../models/review/review.js";
import Session from "../../models/session.js";

// ************************** Admin Auth api's start here ****************************** //

export const adminRegister = async (req, res) => {

  await Admin.create({
    name: "Super Admin",
    email: "admin@healthbridge.com",
    password: "admin123"
  });

  res.status(201).json({ message: "admin regsiterd successfully" })
}


export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const session = await Session.create({
    userId: admin._id,
    role: "admin",
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  });

  res.cookie("sessionId", session._id.toString(), {
    httpOnly: true,
    sameSite: "strict"
  });

  res.status(200).json({
    message: "Admin logged in successfully",
    admin
  });
};




export const adminLogout = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await Session.findByIdAndDelete(sessionId);
  }
  res.clearCookie("sessionId");
  res.json({ message: "Logged out" });
};

// ************************** Admin Auth api's end here ****************************** //






// ************************** Admin Dashboard Overview controller start here ****************************** //
export const adminDashboardOverview = async (req, res) => {
  try {
    /* ======================
    BASIC COUNTS
    ====================== */

    const totalAppointments = await Appointment.countDocuments();
    const totalPatients = await Patient.countDocuments();

    /* ======================
    TOTAL EARNINGS
    ====================== */

    const appointmentEarnings = await Appointment.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const labEarnings = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalEarning =
      (appointmentEarnings[0]?.total || 0) +
      (labEarnings[0]?.total || 0);

    /* ======================
    TOTAL RATING
    ====================== */

    const ratingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);

    const totalRating = ratingResult[0]?.avgRating || 0;

    /* ======================
       EARNINGS OVER TIME (LAST 7 DAYS)
    ====================== */

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const earningsOverTime = await Appointment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* ======================
       APPOINTMENTS THIS WEEK
       ====================== */

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weeklyAppointments = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    /* ======================
    UPCOMING APPOINTMENTS (3)
    ====================== */

    const upcomingAppointments = await Appointment.find({
      status: "scheduled",
      appointmentDate: { $gte: new Date() },
    })
      .populate("doctorId", "firstName lastName")
      .populate("patientId", "name")
      .sort({ appointmentDate: 1 })
      .limit(3);

    /* ======================
    RECENT REVIEWS (2)
  ====================== */

    const recentReviews = await Review.find()
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(2);

    res.status(200).json({
      success: true,
      cards: {
        totalAppointments,
        totalPatients,
        totalEarning,
        totalRating: Number(totalRating.toFixed(1)),
      },
      charts: {
        earningsOverTime,
        weeklyAppointments,
      },
      lists: {
        upcomingAppointments,
        recentReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ************************** Admin Dashboard Overview controller end here ****************************** //


// ************************** doctors Admin  api'start from  here ****************************** //

export const getAllDoctors = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const filter = {};

    // 🔍 Search
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🟡 Status filter
    if (status === "verified") {
      filter.isVerified = true;
      filter.isBanned = false;
    } else if (status === "pending") {
      filter.isVerified = false;
      filter.isBanned = false;
    } else if (status === "banned") {
      filter.isBanned = true;
    }

    const doctors = await Doctor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 📊 Total Patients per doctor
    const doctorIds = doctors.map(d => d._id);

    const patientCounts = await Appointment.aggregate([
      { $match: { doctorId: { $in: doctorIds } } },
      { $group: { _id: "$doctorId", total: { $sum: 1 } } }
    ]);

    const patientMap = {};
    patientCounts.forEach(p => {
      patientMap[p._id.toString()] = p.total;
    });

    // 🎯 Final UI-ready shape
    const formattedDoctors = doctors.map(doc => ({
      id: doc._id,
      name: `${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      phone: doc.phoneNumber,
      specialization: doc.specialization,
      experience: doc.experience || 0,
      joinedDate: doc.createdAt,
      lastActive: doc.lastLogin || doc.updatedAt,
      consultationFee: doc.consultationFee || 0,
      totalPatients: patientMap[doc._id.toString()] || 0,
      status: doc.isBanned
        ? "banned"
        : doc.isVerified
          ? "verified"
          : "pending",
      isVerified: doc.isVerified,
      isBanned: doc.isBanned

    }));

    const totalDoctors = await Doctor.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      totalDoctors,
      totalPages: Math.ceil(totalDoctors / limit),
      doctors: formattedDoctors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};





// verfiy doctor 


export const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isVerified = true;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor verified successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// banned doctor 

export const banDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isBanned = true;

    await doctor.save();

    // 🔥 Force logout doctor
    await Session.deleteMany({
      userId: doctorId,
      role: "doctor"
    });

    res.status(200).json({
      success: true,
      message: "Doctor banned and logged out"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// unbanned doctor 


export const unbanDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.isBanned = false;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor unbanned successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ************************** doctors Admin  api's end from  here ****************************** //

// ************************** [patient] Admin  api's start from  here ****************************** //
export const getAllPatientsPaginated = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    const patients = await Patient.find(filter)
      .select("fullName email phone createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count appointments per patient
    const patientIds = patients.map(p => p._id);

    const appointmentsCount = await Appointment.aggregate([
      {
        $match: { patientId: { $in: patientIds } }
      },
      {
        $group: {
          _id: "$patientId",
          total: { $sum: 1 }
        }
      }
    ]);

    const appointmentMap = {};
    appointmentsCount.forEach(a => {
      appointmentMap[a._id.toString()] = a.total;
    });

    const patientsWithStats = patients.map(p => ({
      ...p,
      totalAppointments: appointmentMap[p._id.toString()] || 0
    }));

    const totalPatients = await Patient.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPatients,
      totalPages: Math.ceil(totalPatients / limit),
      patients: patientsWithStats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
};




export const deletePatientByAdmin = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Remove appointments
    await Appointment.deleteMany({ patientId });

    // Remove sessions
    await Session.deleteMany({ patientId });

    // Delete patient
    await Patient.findByIdAndDelete(patientId);

    res.status(200).json({
      success: true,
      message: "Patient deleted permanently"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete patient" });
  }
};


// ************************** [patient] Admin  api's end from  here ****************************** //

// ************************** [appointment] Admin  api's start from  here ****************************** //

export const getAllAppointmentsAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { status, paymentStatus, date, search } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    let appointments = await Appointment.find(filter)
      .populate("doctorId", "firstName lastName")
      .populate("patientId", "firstName lastName")
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 🔍 Search doctor / patient
    if (search) {
      const keyword = search.toLowerCase();
      appointments = appointments.filter(a =>
        a.doctorId?.firstName.toLowerCase().includes(keyword) ||
        a.patientId?.firstName.toLowerCase().includes(keyword)
      );
    }

    const totalAppointments = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalAppointments,
      totalPages: Math.ceil(totalAppointments / limit),
      appointments
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};


export const cancelAppointmentByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled by admin"
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
};


// ************************** [appointment] Admin  api's end from  here ****************************** //

// ************************** [labortory] Admin  api's start from  here ****************************** //
export const createLaboratory = async (req, res) => {
  try {
    const { name, email, phone, password, location } = req.body;

    const exists = await Laboratory.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Laboratory already exists" });
    }

    const lab = await Laboratory.create({
      name,
      email,
      phone,
      password,
      location
    });

    res.status(201).json({
      success: true,
      message: "Laboratory created successfully",
      labId: lab._id
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create laboratory" });
  }
};


export const getAllLaboratories = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const labs = await Laboratory.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Laboratory.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      laboratories: labs
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch laboratories" });
  }
};

export const updateLaboratory = async (req, res) => {
  try {
    const { id } = req.params;

    const lab = await Laboratory.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).select("-password");

    if (!lab) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    res.status(200).json({
      success: true,
      laboratory: lab
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update laboratory" });
  }
};





// laboarotry payout api's get all lab's payout // 

export const getAllLabPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, laboratoryId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (labId) filter.labId = labId;

    const payouts = await LabPayout.find(filter)
      .populate("laboratoryId", "name email")
      .populate("orderId")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await LabPayout.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      payouts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const markLabPayoutPaid = async (req, res) => {
  try {
    const { payoutId } = req.params;

    const payout = await LabPayout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    if (payout.status === "paid") {
      return res.status(400).json({ message: "Already paid" });
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    await payout.save();

    res.status(200).json({
      success: true,
      message: "Lab payout marked as paid",
      payout,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ************************** [labortory] Admin  api's end from  here ****************************** //

// ************************** [payout] admin to doctor   controller start from  here ****************************** //


// GET /api/v1/admin/doctor-payouts

export const getAllDoctorPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctorId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;

    const payouts = await DoctorPayout.find(filter)
      .populate("doctorId", "name email specialization")
      .populate("appointmentId")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await DoctorPayout.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      payouts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// PUT /api/v1/admin/doctor-payouts/:payoutId/pay
export const markDoctorPayoutPaid = async (req, res) => {
  try {
    const { payoutId } = req.params;

    const payout = await DoctorPayout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    if (payout.status === "paid") {
      return res.status(400).json({ message: "Already paid" });
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    await payout.save();

    res.status(200).json({
      success: true,
      message: "Doctor payout marked as paid",
      payout,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ************************** [payout] admin to doctor   controller end from  here ****************************** //


