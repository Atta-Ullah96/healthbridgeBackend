const canJoinCall = (slot, date) => {
  try {
    if (!slot?.startTime || !slot?.endTime || !date) return false;

    const now = new Date();

    const slotDate = new Date(date);

    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);

    const startTime = new Date(slotDate);
    startTime.setHours(startH, startM - 5, 0, 0); // ✅ 5 min early join buffer

    const endTime = new Date(slotDate);
    endTime.setHours(endH, endM + 5, 0, 0); // ✅ 5 min late buffer

    return now >= startTime && now <= endTime;

  } catch (error) {
    console.error("canJoinCall error:", error);
    return false;
  }
};

export { canJoinCall };
