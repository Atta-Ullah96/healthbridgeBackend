

// ************** slot start from here ********** //

import { Slot } from "../../models/slots/slots.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import ErrorHandler from "../../utils/errorHandler.js";





export const getAvailableSlots = asyncHandler(async (req, res, next) => {

    const { doctorId, date } = req.query;
    console.log({date});
    

    if (!doctorId || !date) {
      return next(new ErrorHandler("doctorId and date are required", 400));
    }

    // Parse selected date
    const selectedDate = new Date(date);
    
    
    selectedDate.setUTCHours(0, 0, 0, 0); // normalize start of day

    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("Selected Date:", selectedDate);

    // ❌ 1. Past date check
    if (selectedDate < today) {
      return res.status(400).json({ message: "Cannot select a past date" });
    }

    // ❌ 2. Future-too-far check (greater than 7 days)
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    maxDate.setHours(23, 59, 59, 999); // include full day

    if (selectedDate > maxDate) {
      return res.status(400).json({
        message: "Slots are only available for the next 7 days",
      });
    }

    // ✔ 3. Fetch slots using date range (timezone-safe)
    const startOfDay = new Date(selectedDate);
   startOfDay.setUTCHours(0, 0, 0, 0);
   console.log({startOfDay});
   
   
   const endOfDay = new Date(selectedDate);
   endOfDay.setUTCHours(23, 59, 59, 999);
   console.log({endOfDay});

    const slots = await Slot.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false,
    }).sort({ startTime: 1 });

    return res.status(200).json({
      message: "Slots fetched successfully",
      slots,
    });

});




export const bookSlot =asyncHandler( async (req, res) => {
 
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ message: "Slot ID is required" });
    }

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return res.status(400).json({
        message: "Slot already booked or does not exist",
      });
    }

    res.status(200).json({
      message: "Slot booked successfully",
      slot,
    });
 
})
