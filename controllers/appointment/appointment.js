import stripe from '../../services/stripeService.js'
import {Appointment} from "../../models/appointements/appointements.js";
import {Slot} from "../../models/slots/slots.js";
import {Payout} from '../../models/admin/payout.js';
import Doctor from "../../models/doctor/doctor.js";
import { createCheckoutSession } from "../../services/stripeService.js";
import { DoctorGig } from "../../models/doctor/doctorgig.js";
import { STRIPE_WEBHOOK_SECRET } from '../../config/config.js';


export const createAppointment = async (req, res) => {
    try {
        const { slotId, doctorId } = req.body;
        const patientId = req.patient._id; // Assuming authentication middleware

        // 1️⃣ Validate slot
        const slot = await Slot.findById(slotId);
        if (!slot) return res.status(404).json({ message: "Slot not found" });

        // Check if slot is already booked
        if (slot.isBooked) return res.status(400).json({ message: "Slot already booked" });

        // 2️⃣ Validate doctor
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        if (slot.doctorId.toString() !== doctorId) {
            return res.status(400).json({ message: "Slot does not belong to this doctor" });
        }
        

        // doctor ammount 
       
        const doctorService = await DoctorGig.findOne({doctorId})
   
        const amount = doctorService.consultationFee;
        // 3️⃣ Create appointment
        let appointment = await Appointment.findOne({ slotId, patientId });

        // If appointment exists and payment not completed
        if (appointment) {
            if (appointment.paymentStatus === "paid") {
                return res.status(400).json({ message: "Appointment already paid" });
            }
            if (appointment.checkoutSessionId) {
                return res.status(200).json({
                    message: "Checkout session already created",
                    checkoutUrl: `https://checkout.stripe.com/pay/${appointment.checkoutSessionId}`,
                });
            }
        } else {
            appointment = await Appointment.create({
                doctorId,
                patientId,
                slotId,
                status: "pending",
                paymentStatus: "pending",
                amount,
            });

            // Mark slot as booked
            slot.isBooked = true;
            slot.patientId = patientId;
            await slot.save();
        }
        const { sessionId, checkoutUrl } = await createCheckoutSession({
            doctorName: doctor.firstName + doctor.lastName,
            amount,
            appointmentId: appointment._id,
            stripe
        });

        // 5️⃣ Save Stripe session ID in appointment
        appointment.checkoutSessionId = sessionId;
        await appointment.save();

        res.status(201).json({
            message: "Appointment created successfully",
            appointmentId: appointment._id,
            checkoutUrl,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};





export const stripeWebhook = async (req, res) => {

    
    let event;

    try {
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        try {
            const appointment = await Appointment.findOne({ checkoutSessionId: session.id }).populate("doctorId");
           
            
            
            if (!appointment) return res.status(404).json({ message: "Appointment not found" });
            
            // Only process if not already paid
            if (appointment.paymentStatus === "paid") {
                return res.status(200).json({ message: "Appointment already marked as paid" });
            }
            
            // ✅ Mark payment as paid
            appointment.paymentStatus = "paid";
            appointment.status = "paid";
            
            // ✅ Calculate commission & doctor earnings
            const commissionRate = 0.1; // 10%
            appointment.commission = appointment.amount * commissionRate;
            appointment.doctorEarnings = appointment.amount - appointment.commission;
            
            await appointment.save();
            
            // ✅ Create Payout record for manual doctor transfer
            await Payout.create({
                doctorId: appointment.doctorId._id,
                appointmentId: appointment._id,
                amount: appointment.doctorEarnings,
                status: "pending",
            });
            
            
            console.log(`Payment processed and appointment updated: ${appointment._id}`);

        } catch (err) {
            console.error("Error processing payment webhook:", err.message);
            return res.status(500).json({ message: err.message });
        }
    }

    res.status(200).json({ received: true });
};



