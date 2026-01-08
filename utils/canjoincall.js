const canJoinCall = (slot) => {
  const now = new Date();

  const slotDate = new Date(slot.date);
  const [startH, startM] = slot.startTime.split(":");
  const [endH, endM] = slot.endTime.split(":");

  const startTime = new Date(slotDate);
  startTime.setHours(startH, startM, 0);

  const endTime = new Date(slotDate);
  endTime.setHours(endH, endM, 0);

  return now >= startTime && now <= endTime;
};

export {canJoinCall};