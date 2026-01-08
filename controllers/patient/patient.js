
import { Patient } from "../../models/patient/patient.js";
import { asyncHandler } from '../../utils/asyncHandler.js'
import Session from "../../models/session.js";
import {Appointment} from "../../models/appointements/appointements.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { MedicalRecord } from "../../models/doctor/medicalrecord.js";
import { patientloginSchema, patientRegisterSchema } from "../../utils/patientValidator.js";

// Register new patient
export const registerPatient = asyncHandler(async (req, res) => {

    const result = patientRegisterSchema.safeParse(req.body);


    if (!result.success) {
        return res.status(400).json({
            errors: result.error.errors,
        });
    }

    const data = result.data;

    const existing = await Patient.findOne({ email: data.email });
    if (existing) {
        return res.status(400).json({ message: "Email already registered" });
    }


    await Patient.create(data);


    res.status(201).json({
        success: true,
        message: "Registration successful",

    });

});

// Login patient
export const loginPatient = asyncHandler(
    async (req, res) => {

        const result = patientloginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.errors,
            });
        }

        const { email, password } = result.data;

        const patient = await Patient.findOne({ email }).select("+password");
        if (!patient) {

            return next(new ErrorHandler("Invalid email or password", 400))
        }

        const isMatch = await patient.matchPassword(password);
        if (!isMatch) {

            return next(new ErrorHandler("Invalid email or password", 400))
        }

        let session = await Session.findOne({ userId: patient._id });


        if (!session) {
            const ttlMs = 24 * 60 * 60 * 1000; // 24 hours
            const expiresAt = new Date(Date.now() + ttlMs);

            session = await Session.create({
                userId: patient._id,
                "role":"patient",
                createdAt: new Date(),
                expiresAt,
            });
        }

        // 4️⃣ Set cookie (even if same session, refresh cookie expiry)
        res.cookie("sessionId", session._id.toString()).json({
            success: true,
            message: "patient Login successfully"
        })




    }
)

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

    const appointments = await Appointment.find({ patient: req.userId })
        .populate("doctor", "name specialty") // fetch doctor details
        .sort({ date: 1 });

    if (!appointments) {
        return next(new ErrorHandler("Appointments not found", 401))
    }

    res.status(200).json({ success: true, appointments });



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




