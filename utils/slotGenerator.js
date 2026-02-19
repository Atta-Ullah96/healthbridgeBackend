import { DoctorAvailability } from "../models/doctor/availavbility.js";
import { Slot } from "../models/slots/slots.js";

export const generateSlots = async (doctorId, duration = 30) => {
  const availability = await DoctorAvailability.findOne({ doctorId });
  if (!availability) return;

  const today = new Date();
  const daysToGenerate = 7;

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 0; i < daysToGenerate; i++) {

    // ✅ Create LOCAL date (no UTC shift)
    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + i
    );

    const formattedDate = formatDateLocal(currentDate);
    const dayName = weekDays[currentDate.getDay()];

    const dayAvailability = availability.days.find(
      (d) => d.day === dayName && d.isAvailable
    );

    if (!dayAvailability) continue;

    for (const slotRange of dayAvailability.timeSlots) {

      let start = toMinutes(slotRange.start);
      const end = toMinutes(slotRange.end);

      while (start + duration <= end) {

        const slotStart = start;
        const slotEnd = start + duration;

        // 🚫 Check break overlap
        const isInBreak = dayAvailability.breaks?.some((breakTime) => {
          const breakStart = toMinutes(breakTime.start);
          const breakEnd = toMinutes(breakTime.end);

          return (
            slotStart < breakEnd &&
            slotEnd > breakStart
          );
        });

        if (!isInBreak) {

          await Slot.updateOne(
            {
              doctorId,
              date: formattedDate,
              startTime: toTime(slotStart),
              endTime: toTime(slotEnd),
            },
            {
              $setOnInsert: {
                doctorId,
                date: formattedDate,
                startTime: toTime(slotStart),
                endTime: toTime(slotEnd),
                isBooked: false,
              },
            },
            { upsert: true }
          );

        }

        start += duration;
      }
    }
  }
};





// 🔹 Convert "09:30" → minutes
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};


// 🔹 Convert minutes → "HH:MM"
const toTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
};


// 🔹 Format date to "YYYY-MM-DD" (LOCAL SAFE)
const formatDateLocal = (date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};
