import { DoctorAvailability } from "../models/doctor/availavbility.js";
import { Slot } from "../models/slots/slots.js";



// Generate slots for the next 7 days
export const generateSlots = async (doctorId, duration = 30) => {
  const availability = await DoctorAvailability.findOne({ doctorId });
  if (!availability) return;

  const today = new Date();
  const daysToGenerate = 7;
  const slotsToInsert = [];

  // Weekday names map (0 = Sunday, 6 = Saturday)
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    currentDate.setHours(0, 0, 0, 0); // normalize to start of day
    const currentDayName = weekDays[currentDate.getDay()];

    const dayAvailability = availability.days.find(
      (d) => d.day === currentDayName && d.isAvailable
    );
    if (!dayAvailability) continue;

    dayAvailability.timeSlots.forEach((slotRange) => {
      let start = convertToMinutes(slotRange.startTime);
      const end = convertToMinutes(slotRange.endTime);

      while (start + duration <= end) {
        const startTime = convertToTimeString(start);
        const endTime = convertToTimeString(start + duration);

        slotsToInsert.push({
          doctorId,
          date: new Date(currentDate), // ensure each slot gets a new Date object
          startTime,
          endTime,
          isBooked: false,
        });

        start += duration;
      }
    });
  }

  // Insert slots, avoid duplicates
  for (const slot of slotsToInsert) {
    await Slot.updateOne(
      {
        doctorId: slot.doctorId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      { $setOnInsert: slot },
      { upsert: true }
    );
  }
};

// Helper functions
const convertToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const convertToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
