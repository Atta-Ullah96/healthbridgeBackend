import { asyncHandler } from "../../utils/asyncHandler.js";
import Doctor from "../../models/doctor/doctor.js";
import ErrorHandler from "../../utils/errorHandler.js"; // your custom error class
import bcrypt from "bcryptjs";
import Session from "../../models/session.js";
import { Appointment } from "../../models/appointements/appointements.js";
import mongoose from "mongoose";
import { AGORA_APP_ID } from "../../config/config.js";
import { BankDetails } from "../../models/doctor/bankdetails.js";
import { doctorLogin, doctorRegisterSchema } from "../../utils/doctorValidator.js";
import { DoctorAvailability } from "../../models/doctor/availavbility.js";
import { generateSlots } from "../../utils/slotGenerator.js";
import { Notification } from "../../models/notifaction/notifaction.js";
import { Slot } from "../../models/slots/slots.js";
import { canJoinCall } from "../../utils/canjoincall.js";
import { ZodError } from "zod";
import { UploadFile } from "../../models/doctor/upload.js";
import { createGetFileFromAws, createUploadFileToAws, verifyStorageFile } from "../../services/awsS3.js";
import { DoctorBasicInfo } from "../../models/doctor/doctorBasicInfo.js";
import { ProfessionalDetails } from "../../models/doctor/professional.js";
import { ProfileSummary } from "../../models/doctor/profileSummary.js";
import { ConsultationSetup } from "../../models/doctor/consultationSetup.js";
import { Location } from "../../models/doctor/location.js";
import { calculateProfileCompletion } from "../../utils/calculateProfileCompletion.js";
import { generateAgoraToken } from "../../utils/agoraToken.js";
import { verifyGoogleToken } from "../../services/continuewithgoogle.js";

// 🩺 Doctor Signup
export const registerDoctor = asyncHandler(async (req, res, next) => {
  const result = doctorRegisterSchema.safeParse(req.body);

  if (!result.success) {
    const errors = {};
    result.error.issues.forEach(issue => {
      errors[issue.path[0]] = issue.message;
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const { name, email, password } = result.data;

  // Check if already exists
  const existingDoctor = await Doctor.findOne({ email });
  if (existingDoctor) {
    return next(new ErrorHandler("Email already registered", 400));
  }

  // Create doctor account
  const doctor = await Doctor.create({
    name,
    email,
    password,
  });

  // 3️⃣ Check for existing session
  let session = await Session.findOne({ userId: doctor._id });

  // TTL deletes expired sessions automatically
  // If session exists → reuse it
  if (!session) {
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + ttlMs);

    session = await Session.create({
      userId: doctor._id,
      role: "doctor",

      expiresAt,
    });
  }

  // 4️⃣ Set cookie (even if same session, refresh cookie expiry)
  res.cookie("sessionId", session._id.toString());

  const finalDoctor = await Doctor.findById(doctor._id).select("-password -googleId");
  res.status(201).json({
    success: true,
    message: "Registration successful",
    finalDoctor

  });
});


export const loginDoctor = asyncHandler(async (req, res, next) => {
  const result = doctorLogin.safeParse({

    email: req.body.email || "",
    password: req.body.password || "",

  });


  if (!result.success) {
    const errors = {};

    if (result.error instanceof ZodError) {
      result.error.issues.forEach(issue => {
        const field = issue.path?.[0] ?? "general";

        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }
  const validateData = result.data;


  // 1️⃣ Find doctor
  const doctor = await Doctor.findOne({ email: validateData.email }).select("+password");
  if (!doctor) return next(new ErrorHandler("Invalid email or password", 401));

  // 2️⃣ Verify password
  const isMatch = await bcrypt.compare(validateData.password, doctor.password);
  if (!isMatch) return next(new ErrorHandler("Invalid email or password", 401));

  if (doctor.isBanned) {
    return next(new ErrorHandler("Your account is banned. Please contact admin", 403));

  }


  // 3️⃣ Check for existing session
  let session = await Session.findOne({ userId: doctor._id });

  // TTL deletes expired sessions automatically
  // If session exists → reuse it
  if (!session) {
    const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = new Date(Date.now() + ttlMs);

    session = await Session.create({
      userId: doctor._id,
      role: "doctor",

      expiresAt,
    });
  }

  // 4️⃣ Set cookie (even if same session, refresh cookie expiry)
  res.cookie("sessionId", session._id.toString());

  // 5️⃣ Respond
  res.status(200).json({
    doctor,
    success: true,
    message: "doctor Login successfully"


  });
});

//me 

export const me = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const doctor = await Doctor.findById(userId).select("-password");

    if (!doctor) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    res.status(401).json({ message: "Invalid session" });
  }
};


export const loginWithGoogle = asyncHandler(async (req, res, next) => {
    const { token } = req.body;

    const { sub, email, name } = await verifyGoogleToken(token);

    const existingUser = await Doctor.findOne({ email });
    

    if (existingUser) {
        let session = await Session.findOne({ userId: existingUser._id });

        if (!session) {
            session = await Session.create({ userId: existingUser._id , role:"doctor" });
        } else {
            session.updatedAt = Date.now(); // optional: refresh session timestamp
            await session.save();
        }
        res.cookie("sessionId", session._id, {
            httpOnly: true,
            secure: true,
        });
        await existingUser.save();
        return res.status(200).json({success:true , message: "Login successful" });
    } else {
            // Create new user in transaction
            const newUser = await Doctor.create(
                {
                    name:name,
                    email:email,
                    role:"doctor",
                    googleId:sub
                },
                
            );

            // Create session for that user inside transaction
            const session = await Session.create(
                { userId: newUser._id , role:"doctor" },
              
            );

            // Set cookie after commit
            res.cookie("sessionId", session._id, {
                httpOnly: true,
                secure: true,
            });

            res.status(201).json({
                message: "User created successfully",
                userId: newUser._id,
            });
       
    }
});

// logout sessions
export const logoutDoctor = asyncHandler(async (req, res) => {
  const userId = req.userId;
  // The middleware already ensures sessionId is valid
  const session =  await Session.findOne({ userId });

  session.deleteOne()
  await session.save()
  // Clear cookie
  res.clearCookie("sessionId");

  res.status(200).json({
    success: true,
    message: "Doctor logged out successfully",
  });
});




// **************************** Doctor Profiles Sections Api's start from here ******************* //


// *********************** section 1 basic Info start ******************************** //

// uploading file to aws s3 bucket us as a storage
export const initiateUpload = asyncHandler(async (req, res, next) => {
  try {
    const doctorId = req.userId; // from auth middleware
    const { fileName, contentType, size, purpose } = req.body;

    const allowedPurposes = [
      "profile_photo",
      "medical_license",
      "degree_certificate",
      "cnic",
    ];

    if (!allowedPurposes.includes(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }
    // 2️⃣ Generate S3 key
    const extension = fileName.split(".").pop();
    const s3Key = `doctor/${doctorId}/${purpose}.${extension}`;


    await UploadFile.findOneAndDelete({ doctorId, purpose });

    let completed = false
    if (purpose === "medical_license" && purpose === "degree_certificate") {
      completed = true
    }

    const upload = await UploadFile.create({
      doctorId,
      fileName,
      purpose,
      s3Key,
      contentType,
      size,
      isUploading: true,
      isCompleted: completed
    });


    const signedUrl = await createUploadFileToAws({ key: s3Key, contentType })
    res.status(200).json({
      uploadId: upload._id,
      signedUrl,

    });
  } catch (error) {
    next(error);
  }
}
)


// verify the file that it is upload properly
export const completeUpload = async (req, res, next) => {
  try {
    const { uploadId } = req.body;
    const doctorId = req.userId;
    const upload = await UploadFile.findById({ _id: uploadId, doctorId });
    if (!upload) {
      return res.status(404).json({ message: "Upload record not found" });
    }
    const headResult = await verifyStorageFile({ key: upload.s3Key })
    // 2️⃣ Validate metadata
    if (headResult.ContentLength !== upload.size) {
      return res.status(400).json({ message: "File size mismatch" });
    }

    if (headResult.ContentType !== upload.contentType) {
      return res.status(400).json({ message: "Invalid content type" });
    }

    // 3️⃣ Mark upload complete
    upload.isUploading = false;
    await upload.save();

    res.status(200).json({
      success: true,
      message: "Upload verified successfully",

    });
  } catch (error) {
    next(error);
  }
};




export const updateBasicInfo = async (req, res) => {
  try {
    const doctorId = req.userId; // from auth middleware

    const { firstName, lastName, gender, dob, phone, email, profileImage, } = req.body;




    // ✅ validate image ownership (VERY IMPORTANT)
    if (profileImage) {
      const image = await UploadFile.findOne({
        _id: profileImage,
        doctorId,
      });

      if (!image) {
        return res.status(403).json({
          message: "Invalid profile image",
        });
      }
    }

    // ✅ update doctor
    const doctor = await DoctorBasicInfo.findByIdAndUpdate(
      doctorId,
      {
        doctorId,
        firstName,
        lastName,
        gender,
        dob,
        phone,
        email,
        profileImage,
        isCompleted:true
      },
      { new: true, upsert: true }
    ).populate("profileImage");

    res.status(200).json({
      message: "Basic info updated successfully",
      doctor
    });
  } catch (error) {
    console.error("Update Basic Info Error:", error);
    res.status(500).json({
      message: "Failed to update basic info",
    });
  }
};


export const getBasicInfo = async (req, res) => {
  try {
    const doctorId = req.userId;

    const doctor = await DoctorBasicInfo.findById(doctorId).populate("profileImage");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let profileImageUrl = null;

    if (doctor.profileImage?.s3Key) {
      profileImageUrl = await createGetFileFromAws({ key: doctor?.profileImage?.s3Key })
    }

    res.status(200).json({
      success: true,
      doctorInfo: {
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        gender: doctor.gender,
        dob: doctor.dob,
        phone: doctor.phone,
        email: doctor.email,
        profileImageUrl,
        isCompleted: true, // ✅ signed GET URL
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch basic info" });
  }
};


// *********************** section 1 basic Info  end ******************************** //

// *********************** section 2 professional details   start ******************************** //

export const getProfessionalDetails = asyncHandler(async (req, res) => {
  const doctorId = req.userId; // from auth middleware

  const details = await ProfessionalDetails.findOne({ doctorId });

  if (!details) {
    return res.status(404).json({
      success: false,
      message: "Professional details not found",
    });
  }

  res.status(200).json({ success: true, data: details });
});

export const updateProfessionalDetails = asyncHandler(async (req, res) => {
  const doctorId = req.userId; // from auth middleware
  const {
    specialization,
    yearsOfExperience,
    pmcNumber,
    qualification,
    institute,
    graduationYear,
  } = req.body;


  // Validate required fields
  if (
    !specialization ||
    yearsOfExperience == null ||
    !pmcNumber ||
    !qualification ||
    !institute ||
    !graduationYear
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Upsert: update if exists, otherwise create
  const updatedDetails = await ProfessionalDetails.findOneAndUpdate(
    { doctorId },
    {
      doctorId,
      specialization,
      yearsOfExperience,
      pmcNumber,
      qualification,
      institute,
      graduationYear,
      isCompleted: true
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({
    success: true,
    message: "Professional details saved successfully",
    data: updatedDetails,
  });
});
// *********************** section 2 professional details   end ******************************** //

// *********************** section 3 profile complete   start******************************** //

export const getProfileCompletion = async (req, res, next) => {
  try {
    const doctorId = req.userId;

    const basicInfo = await DoctorBasicInfo.findById(doctorId);
    const professional = await ProfessionalDetails.findOne({ doctorId });
    const consultation = await ConsultationSetup.findOne({ doctorId });
    const profileSummary = await ProfileSummary.findOne({ doctorId });
    const location = await Location.findOne({ doctorId });
    const availability = await DoctorAvailability.findOne({ doctorId });
    const documents = await UploadFile.findOne({ doctorId });

    const completion = calculateProfileCompletion({
      basicInfo,
      professional,
      consultation,
      profileSummary,
      location,
      documents,
      availability

    });

    res.status(200).json({
      completion,
      isComplete: completion === 100,
    });
  } catch (err) {
    next(err);
  }
};
// *********************** section 3 profile complete   end******************************** //

// *********************** section 4 profile summary  start******************************** //
export const getProfileSummary = async (req, res, next) => {
  try {
    const doctorId = req.userId;

    const summary = await ProfileSummary.findOne({ doctorId });

    res.status(200).json(summary || null);
  } catch (err) {
    next(err);
  }
};

export const updateProfileSummary = async (req, res, next) => {
  try {
    const doctorId = req.userId;
    const { about, languages } = req.body;
    console.log(about, languages)

    const summary = await ProfileSummary.findOneAndUpdate(
      { doctorId },
      {
        about,
        languages,
        isCompleted: true,
      },
      {
        new: true,
        upsert: true, // 🔥 create if not exists
        runValidators: true,
      }
    );

    res.status(200).json({ message: "summary updated successfully" });
  } catch (err) {
    next(err);
  }
};

// *********************** section 4 profile summary   end******************************** //

// *********************** section 5 documents start here  ******************************** //
export const getDoctorDocuments = asyncHandler(async (req, res) => {
  const doctorId = req.userId;

  const documents = await UploadFile.find({ doctorId }).select(
    "purpose s3Key status createdAt"
  );

  res.status(200).json(documents);
});


export const getDocumentViewUrl = asyncHandler(async (req, res) => {
  const doctorId = req.userId;
  const { purpose } = req.params;



  const upload = await UploadFile.findOne({ doctorId, purpose });


  if (!upload) {
    return res.status(404).json({ message: "Document not found" });
  }

  const url = await createGetFileFromAws({ key: upload?.s3Key })

  res.status(200).json({ url });
});

// *********************** section 5 documents end  here  end******************************** //

// *********************** section 6 consultationSetup start  here  ******************************** //



// Get doctor consultation setup
export const getConsultationSetup = asyncHandler(async (req, res) => {
  const doctorId = req.userId; // from auth middleware
  const setup = await ConsultationSetup.findOne({ doctorId });
  res.status(200).json(setup || {});
});

// Create or Update doctor consultation setup
export const upsertConsultationSetup = asyncHandler(async (req, res) => {
  const doctorId = req.userId;
  const { title, description, fee, duration, modes } = req.body;

  // Validation
  if (!title || !fee || !duration || !modes || !modes.length) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Check if setup exists
  let setup = await ConsultationSetup.findOne({ doctorId });

  if (setup) {
    // Update existing
    setup.title = title;
    setup.description = description;
    setup.fee = fee;
    setup.duration = duration;
    setup.modes = modes;
    setup.isCompleted = true
    await setup.save();
  } else {
    // Create new
    setup = await ConsultationSetup.create({
      doctorId,
      title,
      description,
      fee,
      duration,
      modes,
      isCompleted: true
    });
  }

  res.status(200).json({ message: "Consultation created Successfully" });
});

// *********************** section 6 consultationSetup end  here  ******************************** //

// *********************** section 7 Availability start  here  ******************************** //
// *********************** section 7 Availability end  here  ******************************** //

// *********************** section 8 location start  here  ******************************** //

export const getLocation = async (req, res, next) => {
  try {
    const doctorId = req.userId;

    const location = await Location.findOne({ doctorId });

    res.status(200).json(location || null);
  } catch (err) {
    next(err);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const doctorId = req.userId;
    const { city, address, clinicName, mapLink } = req.body;

    await Location.findOneAndUpdate(
      { doctorId },
      {
        city, address, clinicName, mapLink, isCompleted: true
      },
      {
        new: true,
        upsert: true, // 🔥 create if not exists
        runValidators: true,
      }
    );

    res.status(200).json({ message: "Location Created Successfully" });
  } catch (err) {
    next(err);
  }
};

// *********************** section 8 location end  here  ******************************** //


// ************** availability  start here ****************** //

export const createOrUpdateAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.userId;

  const availability = await DoctorAvailability.findOneAndUpdate(
    { doctorId },
    { days: req.body.days, isCompleted: true },
    { new: true, upsert: true }
  );

  const consultation = await ConsultationSetup.find({ doctorId });

  // 🔥 regenerate slots whenever availability changes
  await generateSlots(doctorId, consultation.duration);

  res.status(200).json({
    success: true,
    message: "Availability saved successfully",
    data: availability
  });
});



// get availability 

export const getAvailability = asyncHandler(async (req, res) => {

  const doctorId = req.userId
  const availability = await DoctorAvailability.findOne({ doctorId });

  if (!availability) {
    return res.status(404).json({ success: false, message: "No availability found" });
  }

  res.status(200).json({ success: true, data: availability });

})
export const getAvailabilityForBook = asyncHandler(async (req, res) => {

  const { doctorId } = req.params
  const availability = await DoctorAvailability.findOne({ doctorId });

  if (!availability) {
    return res.status(404).json({ success: false, message: "No availability found" });
  }

  res.status(200).json({ success: true, data: availability });

})


// ************** availability  end here ****************** //

// **************************** Doctor Profiles Sections Api's end  here ******************* //


//******************************Appointment Apis started from here************************************ *//


// doctor view their appointments 

export const getDoctorAppointments = asyncHandler(async (req, res) => {

  const appointments = await Appointment.find({ doctorId: req.userId })
    .populate({
      path: 'patientId',
      select: 'name phone' // Only get these fields
    })
    .populate({
      path: 'slotId',
      select: 'startTime' // Only get startTime
    })
    .sort({ date: 1 });



if (!appointments) {
  return next(new ErrorHandler("appointemetns not found", 401))
}

return res.status(200).json({ success: true, appointments });



});

// get confrimed appointments 

export const getDoctorConfirmedAppointments = async (req, res) => {
  try {
    const doctorId = req.userId;
    
    const appointments = await Appointment.find({
      doctorId,
      status: "confirmed"
    })
    .populate("patientId", "name phone")
    .populate("slotId");
    
    const result = appointments?.map(app => ({
      ...app.toObject(),
      canJoinCall: canJoinCall(app?.slotId , app?.selectedDate)
    }));
    
    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// accept btn api
export const acceptAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.userId;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // doctor authorization
    if (appointment.doctorId.toString() !== doctorId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    // payment must be completed
    if (appointment.paymentStatus !== "paid")
      return res.status(400).json({ message: "Payment not completed" });

    // valid state check
    
    // accept appointment
    appointment.status = "confirmed";
    await appointment.save();

 

    res.status(200).json({
      message: "Appointment accepted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// reject btn api 
export const rejectAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.userId;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // doctor authorization
    if (appointment.doctorId.toString() !== doctorId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    // payment check
    if (appointment.paymentStatus !== "paid")
      return res.status(400).json({ message: "Payment not completed" });

    // prevent double action
    if (appointment.status !== "paid")
      return res.status(400).json({ message: "Appointment cannot be rejected now" });

    // reject appointment
    appointment.status = "rejected";
    await appointment.save();

    // release slot
    await Slot.findByIdAndUpdate(appointment.slotId, {
      isBooked: false,
      patientId: null
    });

    // notify patient
    await Notification.create({
      patientId: appointment.patientId,
      role: "patient",
      title: "Appointment Rejected",
      message: "The doctor rejected your appointment. Please book another slot.",
      type: "appointment"
    });

    res.status(200).json({
      message: "Appointment rejected successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// completed Api 

export const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.userId;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    if (appointment.doctorId.toString() !== doctorId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (appointment.status !== "confirmed")
      return res.status(400).json({ message: "Appointment not active" });

    appointment.status = "completed";
    await appointment.save();

    // notify patient
    await Notification.create({
      patientId: appointment.patientId,
      role: "patient",
      title: "Appointment Completed",
      message: "Your appointment has been completed. You can now leave a review.",
      type: "appointment"
    });

    res.json({ message: "Appointment marked as completed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//******************************Appointment Apis ends from here************************************ *//

// Controller to get all patients for a doctor dashboard
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.userId;

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

  const existing = await BankDetails.findOne({ doctor: req.userId });
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

  const bankDetails = await BankDetails.findOne({ doctor: req.userId });
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
  const bankDetails = await BankDetails.findOne({ doctor: req.userId });

  if (!bankDetails) {
    return next(new ErrorHandler("Bank details not found.", 404));
  }

  res.status(200).json({
    success: true,
    data: bankDetails,
  });
});


export const deleteBankDetails = asyncHandler(async (req, res, next) => {
  const bankDetails = await BankDetails.findOne({ doctor: req.userId });

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
  const doctorId = req.userId;

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
  const doctorId = req.userId;

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
    doctor: req.userId,
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




// get doctor publically 

export const getDoctors = async (req, res) => {
  try {
    const {
      specialization,
      location,
      gender,
      consultationType,
      minRating
    } = req.query;

    // ================= AGGREGATION PIPELINE =================
    const pipeline = [
      // Join basic info
      {
        $lookup: {
          from: "doctorbasicinfos",
          localField: "_id",
          foreignField: "doctorId",
          as: "basicInfo"
        }
      },
      { $unwind: "$basicInfo" },

      // Join profile picture
      {
        $lookup: {
          from: "uploads",
          localField: "basicInfo.profileImage",
          foreignField: "_id",
          as: "profilePicData"
        }
      },
      {
        $unwind: {
          path: "$profilePicData",
          preserveNullAndEmptyArrays: true
        }
      },

      // Professional details
      {
        $lookup: {
          from: "professionaldetails",
          localField: "_id",
          foreignField: "doctorId",
          as: "professional"
        }
      },
      { $unwind: "$professional" },

      // Location
      {
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "doctorId",
          as: "location"
        }
      },
      { $unwind: "$location" },

      // Bio (languages)
      {
        $lookup: {
          from: "profilesummaries",
          localField: "_id",
          foreignField: "doctorId",
          as: "bio"
        }
      },
      { $unwind: "$bio" },

      // Consultation setup
      {
        $lookup: {
          from: "consultationsetups",
          localField: "_id",
          foreignField: "doctorId",
          as: "consultation"
        }
      },
      { $unwind: "$consultation" }
    ];

    // ================= DYNAMIC FILTERS =================
    const match = {};

    if (specialization) match["professional.specialization"] = specialization;
    if (location) match["location.city"] = location;
    if (gender) match.gender = gender;
    if (consultationType) match["consultation.modes"] = consultationType;
    if (minRating) match.rating = { $gte: Number(minRating) };

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // ================= PROJECT FINAL FIELDS =================
    pipeline.push({
      $project: {
        firstName: "$basicInfo.firstName",
        lastName: "$basicInfo.lastName",
        s3Key: "$profilePicData.s3Key",
        specialization: "$professional.specialization",
        experience: "$professional.yearsOfExperience",
        languages: "$bio.languages",
        location: "$location.city",
        consultationFee: "$consultation.fee",
        consultationType: "$consultation.modes",
        rating: 1
      }
    });

    // ================= EXECUTE AGGREGATION =================
    const doctors = await Doctor.aggregate(pipeline);

    // ================= GENERATE SIGNED URLs =================
    const doctorsWithSignedUrls = await Promise.all(
      doctors.map(async (doc) => {
        let profilePic = null;

        if (doc.s3Key) {
          profilePic = await createGetFileFromAws({ key: doc.s3Key });
        }

        return {
          ...doc,
          profilePic,
          s3Key: undefined // remove raw key from response
        };
      })
    );

    res.status(200).json(doctorsWithSignedUrls);
  } catch (error) {
    console.error("getDoctors error:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};




export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // ================= AGGREGATION PIPELINE =================
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(doctorId) } },

      // Basic Info
      {
        $lookup: {
          from: "doctorbasicinfos",
          localField: "_id",
          foreignField: "doctorId",
          as: "basicInfo",
        },
      },
      { $unwind: "$basicInfo" },

      // Profile Image
      {
        $lookup: {
          from: "uploads",
          localField: "basicInfo.profileImage",
          foreignField: "_id",
          as: "profilePicData",
        },
      },
      {
        $unwind: {
          path: "$profilePicData",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Professional Details
      {
        $lookup: {
          from: "professionaldetails",
          localField: "_id",
          foreignField: "doctorId",
          as: "professional",
        },
      },
      { $unwind: "$professional" },

      // Location
      {
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "doctorId",
          as: "location",
        },
      },
      { $unwind: "$location" },

      // Bio / Summary
      {
        $lookup: {
          from: "profilesummaries",
          localField: "_id",
          foreignField: "doctorId",
          as: "bio",
        },
      },
      { $unwind: "$bio" },

      // Consultation Setup
      {
        $lookup: {
          from: "consultationsetups",
          localField: "_id",
          foreignField: "doctorId",
          as: "consultation",
        },
      },
      { $unwind: "$consultation" },

      // Reviews from patients
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "doctorId",
          as: "reviews",
        },
      },

      // availability
      {
        $lookup: {
          from: "doctoravailabilities",
          localField: "_id",
          foreignField: "doctorId",
          as: "availability",
        },
      },

      // Final projection
      {
        $project: {
          firstName: "$basicInfo.firstName",
          lastName: "$basicInfo.lastName",
          s3Key: "$profilePicData.s3Key",
          specialization: "$professional.specialization",
          qualifications: "$professional.qualification",
          institute: "$professional.institute",
          graduationYear: "$professional.graduationYear",
          experience: "$professional.yearsOfExperience",
          areaOfExpertise: "$professional.areaOfExpertise",
          languages: "$bio.languages",
          summary: "$bio.about",
          location: "$location.city",
          consultationFee: "$consultation.fee",
          consultationType: "$consultation.modes",
          availability: "$availability.days",
          reviews: 1, // include review subdocuments
        },
      },
    ];

    // ================= EXECUTE AGGREGATION =================
    const doctors = await Doctor.aggregate(pipeline);
    if (!doctors.length) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctor = doctors[0];

    // ================= SIGNED URL =================
    if (doctor.s3Key) {
      doctor.profilePic = await createGetFileFromAws({ key: doctor.s3Key });
    } else {
      doctor.profilePic = null;
    }
    delete doctor.s3Key;

    // ================= RESPONSE =================
    res.status(200).json(doctor);
  } catch (error) {
    console.error("getDoctorProfile error:", error);
    res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
};




export const joinVideoCallByDoctor = async(req ,res) =>{
    const { id } = req.params;
    const userId = req.userId;
    

    const appointment = await Appointment.findById(id);
    

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Security check
    if (
      appointment.doctorId.toString() !== userId.toString() 
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

