import { asyncHandler } from "../../utils/asyncHandler.js";
import Doctor from "../../models/doctor/doctor.js";
import ErrorHandler from "../../utils/errorHandler.js"; // your custom error class
import bcrypt from "bcryptjs";
import Session from "../../models/session.js";
import Appointment from "../../models/appointements/appointements.js";
import { DoctorGig } from "../../models/doctor/doctorgig.js";
import { Slot } from "../../models/doctor/slots.js";
import { BankDetails } from "../../models/doctor/bankdetails.js";
import { availabilitySchema, createGigSchema, doctorLogin, doctorRegistrationSchema, updateGigSchema } from "../../utils/zod.js";
import { DoctorAvailability } from "../../models/doctor/availavbility.js";
import { generateSlots } from "../../utils/slotGenerator.js";


// 🩺 Doctor Signup
export const registerDoctor = asyncHandler(async (req, res, next) => {
  const validatedData = doctorRegistrationSchema.parse({
    ...req.body,
    pmcCertificate: req.file,
  });
  console.log(validatedData);
  

  const existingDoctor = await Doctor.findOne({ email: validatedData.email });
  if (existingDoctor) {
    return next(new ErrorHandler("Email already registered", 400));
  }

   await Doctor.create({
    ...validatedData,
    pmcCertificate:req.file.filename
  });



  res.status(201).json({
    success: true,
    message: "Doctor registered successfully",

  });
});


export const loginDoctor = asyncHandler(async (req, res, next) => {
  const validateData =  doctorLogin.parse(req.body);

  // 1️⃣ Find doctor
  const doctor = await Doctor.findOne({ email: validateData.email }).select("+password");
  if (!doctor) return next(new ErrorHandler("Invalid email or password", 401));

  // 2️⃣ Verify password
  const isMatch = await bcrypt.compare(validateData.password, doctor.password);
  if (!isMatch) return next(new ErrorHandler("Invalid email or password", 401));

  // 3️⃣ Check for existing session
  let session = await Session.findOne({ doctorId: doctor._id });

  // TTL deletes expired sessions automatically
  // If session exists → reuse it
  if (!session) {
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + ttlMs);

    session = await Session.create({
      doctorId: doctor._id,
      createdAt: new Date(),
      expiresAt,
    });
  }

  // 4️⃣ Set cookie (even if same session, refresh cookie expiry)
  res.cookie("doctorSessionId", session._id.toString());

  // 5️⃣ Respond
  res.status(200).json({
    success: true,
    message: "doctor Login successfully"


  });
});


// logout sessions
export const logoutDoctor = asyncHandler(async (req, res) => {
  const { doctorSessionId } = req.cookies;

  // The middleware already ensures sessionId is valid
  await Session.findByIdAndDelete(doctorSessionId);

  // Clear cookie
  res.clearCookie("doctorSessionId");

  res.status(200).json({
    success: true,
    message: "Doctor logged out successfully",
  });
});



//******************************Appointment Apis started from here************************************ *//


// doctor view their appointments 

export const getDoctorAppointments = asyncHandler(async (req, res) => {

  const appointments = await Appointment.find({ doctor: req.doctor.id })
    .populate("patient", "name email")
    .sort({ date: 1 });

  if (!appointments) {
    return next(new ErrorHandler("appointemetns not found", 401))
  }

  return res.status(200).json({ success: true, appointments });



});





// Doctor updates status of an appointment //
export const updateAppointmentStatus = asyncHandler(async (req, res) => {

  const { appointmentId } = req.params;
  const { status } = req.body;

  // Only allow valid statuses for doctor
  const allowedStatuses = ["approved", "rejected", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {

    return next(new ErrorHandler("Invalid status", 400))
  }

  // Find the appointment and check if it belongs to this doctor
  const appointment = await Appointment.findOne({ _id: appointmentId, doctor: req.doctor.id });
  if (!appointment) {
    return next(new ErrorHandler("Appointment not found", 404))

  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({ success: true, message: "update the status successfully" });

})






// Get all confirmed (approved) appointments for doctor
export const getConfirmedAppointments = asyncHandler(async (req, res) => {

  const appointments = await Appointment.find({ doctor: req.doctor.id, status: "approved" })
    .populate("patient", "name email")
    .sort({ date: 1 });

  res.status(200).json({ success: true, appointments });

});




// Controller to get all patients for a doctor dashboard
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.doctor.id;

    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "name email phone")
      .sort({ date: -1 }); // latest appointment first

    // Use a map to keep only unique patients
    const uniquePatientsMap = new Map();
    appointments.forEach(app => {
      if (!uniquePatientsMap.has(app.patient._id.toString())) {
        uniquePatientsMap.set(app.patient._id.toString(), {
          _id: app.patient._id,
          name: app.patient.name,
          email: app.patient.email,
          phone: app.patient.phone,
          lastAppointment: app.date,
          totalAppointments: 1
        });
      } else {
        const patientData = uniquePatientsMap.get(app.patient._id.toString());
        patientData.totalAppointments += 1;
        // update last appointment if this is more recent
        if (app.date > patientData.lastAppointment) {
          patientData.lastAppointment = app.date;
        }
        uniquePatientsMap.set(app.patient._id.toString(), patientData);
      }
    });

    const patients = Array.from(uniquePatientsMap.values());

    res.status(200).json({ success: true, patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};




// **************** doctor gig  apis ******************* //


export const createGig = asyncHandler(async (req, res, next) => {
  const validatedData = createGigSchema.parse({
    ...req.body,
    profileImage: req.file,
  });

  


  const gig = await DoctorGig.create({
    doctorId: req.doctor._id, // assuming doctor is logged in and user info is in req.user
    ...validatedData,
    profileImage: req.file.filename
  });

  res.status(201).json({
    success: true,

    message: "Doctor gig created successfully",
  });
});


// @desc    Get all gigs of logged-in doctor
// @route   GET /api/doctors/gigs
// @access  Private (Doctor only)

export const getMyGigs = asyncHandler(async (req, res, next) => {
  const gigs = await DoctorGig.find({ doctorId: req.doctor._id });

  res.status(200).json({
    success: true,
     gigs
  });
});





// @desc    Update a doctor gig
// @route   PUT /api/doctors/gigs/:id
// @access  Private (Doctor only)

export const updateGig = asyncHandler(async (req, res, next) => {
  const {id} = req.params;
  if(!id){
    return next(new ErrorHandler("Gig Id not found" , 404))
  }
   const validatedData = updateGigSchema.parse(req.body);

    // Find current gig
    const gig = await DoctorGig.findById(id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    // If new image provided
    if (req.file) {
      validatedData.profileImage = req.file.filename;

      // Optional: delete old file from uploads folder
      // fs.unlinkSync(`uploads/${gig.profileImage}`);
    } else {
      // Keep old image
      validatedData.profileImage = gig.profileImage;
    }

    const updated = await DoctorGig.findByIdAndUpdate(id, validatedData, { new: true });

    return res.json({
      message: "Gig updated successfully",
      gig: updated,
    });
});



// delete doctor gig api // 

// @desc    Delete a doctor gig
// @route   DELETE /api/doctors/gigs/:id
// @access  Private (Doctor only)
export const deleteGig = asyncHandler(async (req, res, next) => {
  const {id} = req.params;

  const gig = await DoctorGig.findById(id);

  if (!gig) {
    return next(new ErrorHandler("Gig not found", 404));
  }

  // Ensure the doctor owns the gig
  if (gig.doctorId.toString() !== req.doctor._id.toString()) {
    return next(new ErrorHandler("You are not authorized to delete this gig", 403));
  }

  await gig.deleteOne();

  res.status(200).json({
    success: true,
    message: "Doctor gig deleted successfully",
  });
});


// ************** gig end here ****************** //


// ************** availability  start here ****************** //

export const createOrUpdateAvailability = asyncHandler(async (req, res) => {
 
    const doctorId = req.doctor._id; // from auth middleware
    const parsedData = availabilitySchema.parse(req.body);

    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctorId },
      { days: parsedData.days },
      { new: true, upsert: true }
    );

    const doctor = await Doctor.findById(doctorId)
     await generateSlots(doctorId, doctor.duration);
    res.status(200).json({
      success: true,
      message: "Availability saved successfully",
      data: availability
    })

  })




// get availability 

export const getAvailability =asyncHandler( async (req, res) => {
  
    const doctorId = req.doctor._id;
    const availability = await DoctorAvailability.findOne({ doctorId });

    if (!availability) {
      return res.status(404).json({ success: false, message: "No availability found" });
    }

    res.status(200).json({ success: true, data: availability });
  
})


// ************** availability  end here ****************** //



// ************** slot start from here ********** //






// @desc    Create a new slot
// @route   POST /api/slots
// @access  Doctor (Private)

export const createSlot = asyncHandler(async (req, res, next) => {
  const { doctorId, startTime, endTime } = req.body;

  if (!doctorId || !startTime || !endTime) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found.", 404));
  }

  const slot = await Slot.create({
    doctor: doctorId,
    startTime,
    endTime,
  });

  res.status(201).json({
    success: true,
    message: "Slot created successfully.",
    data: slot,
  });
});



// GET available slots for a doctor on a specific date
export const getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "Doctor and date are required" });
    }

    // Convert string date to Date object (ignore time)
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Find slots for that doctor on the selected date which are not booked
    const slots = await Slot.find({
      doctorId,
      date: selectedDate,
      isBooked: false
    }).sort({ startTime: 1 }); // sort by start time

    res.status(200).json({ success: true, data: slots });
});



// ******** slot apis ends here **********//



// ******** bank apis start here **********//



/**
 * @desc    Create bank details
 * @route   POST /api/doctors/bank
 * @access  Private (Doctor)
 */
export const createBankDetails = asyncHandler(async (req, res, next) => {
  const { accountHolderName, accountNumber, bankName, ifscCode } = req.body;

  if (!accountHolderName || !accountNumber || !bankName || !ifscCode) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  const existing = await BankDetails.findOne({ doctor: req.doctor._id });
  if (existing) {
    return next(new ErrorHandler("Bank details already exist. Use update API.", 400));
  }

  const bankDetails = await BankDetails.create({
    doctor: req.user._id,
    accountHolderName,
    accountNumber,
    bankName,
    ifscCode,
  });

  res.status(201).json({
    success: true,
    message: "Bank details created successfully.",
    data: bankDetails,
  });
});

/**
 * @desc    Update bank details
 * @route   PUT /api/doctors/bank
 * @access  Private (Doctor)
 */
export const updateBankDetails = asyncHandler(async (req, res, next) => {
  const { accountHolderName, accountNumber, bankName, ifscCode } = req.body;

  const bankDetails = await BankDetails.findOne({ doctor: req.doctor._id });
  if (!bankDetails) {
    return next(new ErrorHandler("Bank details not found. Use create API.", 404));
  }

  if (accountHolderName) bankDetails.accountHolderName = accountHolderName;
  if (accountNumber) bankDetails.accountNumber = accountNumber;
  if (bankName) bankDetails.bankName = bankName;
  if (ifscCode) bankDetails.ifscCode = ifscCode;

  await bankDetails.save();

  res.status(200).json({
    success: true,
    message: "Bank details updated successfully.",
    data: bankDetails,
  });
});

/**
 * @desc    Get doctor bank details
 * @route   GET /api/doctors/bank
 * @access  Private (Doctor)
 */
export const getBankDetails = asyncHandler(async (req, res, next) => {
  const bankDetails = await BankDetails.findOne({ doctor: req.doctor._id });

  if (!bankDetails) {
    return next(new ErrorHandler("Bank details not found.", 404));
  }

  res.status(200).json({
    success: true,
    data: bankDetails,
  });
});


export const deleteBankDetails = asyncHandler(async (req, res, next) => {
  const bankDetails = await BankDetails.findOne({ doctor: req.doctor._id });

  if (!bankDetails) {
    return next(new ErrorHandler("Bank details not found.", 404));
  }

  await bankDetails.deleteOne();

  res.status(200).json({
    success: true,
    message: "Bank details deleted successfully.",
  });
});

// ******** bank apis ends here **********//


// ******** earning apis start here **********//


/**
 * @desc    Get total earnings of logged-in doctor
 * @route   GET /api/doctors/earnings
 * @access  Private (Doctor)
 */
export const getDoctorEarnings = asyncHandler(async (req, res, next) => {
  const doctorId = req.doctor._id;

  // Only count completed and paid appointments
  const completedAppointments = await Appointment.find({ doctor: doctorId, status: "completed", paid: true });

  if (!completedAppointments.length) {
    return res.status(200).json({
      success: true,
      totalEarnings: 0,
      count: 0,
      appointments: [],
    });
  }

  const totalEarnings = completedAppointments.reduce((sum, appointment) => sum + appointment.consultationFee, 0);

  res.status(200).json({
    success: true,
    totalEarnings,
    count: completedAppointments.length,
    appointments: completedAppointments, // Optional: return the list of appointments
  });
});

// ******** earning apis end here **********//
// ******** overview  apis start here **********//



export const getDoctorOverview = asyncHandler(async (req, res, next) => {
  const doctorId = req.doctor._id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // 1️⃣ Today appointments count (completed or scheduled)
  const todayAppointmentsCount = await Appointment.countDocuments({
    doctor: doctorId,
    appointmentDate: { $gte: startOfToday, $lt: endOfToday }
  });

  // 2️⃣ Pending requests count
  const pendingRequestsCount = await Appointment.countDocuments({
    doctor: doctorId,
    status: "pending"
  });

  // 3️⃣ Today's schedule (limit 2 patients)
  const todaySchedule = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: startOfToday, $lt: endOfToday }
  })
    .sort({ appointmentDate: 1 })
    .limit(2)
    .populate("patient", "name email");

  // 4️⃣ Earnings in the last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthAppointments = await Appointment.find({
    doctor: doctorId,
    status: "completed",
    paid: true,
    appointmentDate: { $gte: lastMonthStart, $lt: lastMonthEnd }
  });

  const lastMonthEarnings = lastMonthAppointments.reduce(
    (sum, appointment) => sum + appointment.consultationFee,
    0
  );

  res.status(200).json({
    success: true,
    overview: {
      todayAppointmentsCount,
      pendingRequestsCount,
      todaySchedule,
      lastMonthEarnings,
    },
  });
});

// ******** overview  apis ends here **********//


// ******** medical Record  apis start here **********//


/**
 * @desc    Add medical record
 * @route   POST /api/records
 * @access  Doctor (Private)
 */
export const addMedicalRecord = asyncHandler(async (req, res, next) => {
  const { patientId, appointmentId, description, files } = req.body;

  if (!patientId || !appointmentId) {
    return next(new ErrorHandler("Patient and appointment are required", 400));
  }

  const record = await MedicalRecord.create({
    patient: patientId,
    doctor: req.doctor._id,
    appointment: appointmentId,
    description,
    files, // array of {filename, url}
  });

  res.status(201).json({
    success: true,
    message: "Medical record added successfully",
    data: record,
  });
});

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


// ******** medical Record  apis ends here **********//









