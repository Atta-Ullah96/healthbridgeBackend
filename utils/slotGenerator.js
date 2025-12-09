import { DoctorAvailability } from "../models/doctor/availavbility.js";
import { Slot } from "../models/doctor/slots.js";

export const generateSlots = async (doctorId, duration = 30) => {
  const availability = await DoctorAvailability.findOne({ doctorId });
  if (!availability) return;

  const today = new Date();
  const daysToGenerate = 30;
  const slotsToInsert = [];

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() + i);
    const currentDayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });

    const dayAvailability = availability.days.find(d => d.day === currentDayName && d.isAvailable);
    if (!dayAvailability) continue;

    dayAvailability.timeSlots.forEach(slotRange => {
      let start = convertToMinutes(slotRange.startTime);
      const end = convertToMinutes(slotRange.endTime);

      while (start + duration <= end) {
        const startTime = convertToTimeString(start);
        const endTime = convertToTimeString(start + duration);

        slotsToInsert.push({
          doctorId,
          date: currentDate,
          startTime,
          endTime,
          isBooked: false
        });

        start += duration;
      }
    });
  }

  // Insert slots, avoid duplicates
  for (const slot of slotsToInsert) {
    await Slot.updateOne(
      { doctorId: slot.doctorId, date: slot.date, startTime: slot.startTime, endTime: slot.endTime },
      { $setOnInsert: slot },
      { upsert: true }
    );
  }
};

// Helpers
const convertToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const convertToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
