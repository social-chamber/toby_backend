export function slotGenerator(date, start, end, slotDurationHours, stepMinutes = 60) {
  const slots = [];

 function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  if (t === "00:00") return 1440;
  return h * 60 + m;
}

  function minutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24; // mod 24 for times past midnight
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  let startMins = timeToMinutes(start);
  let endMins = timeToMinutes(end);
  const slotDurationMins = slotDurationHours * 60;

  // If end is less than start, it means it goes overnight to next day
  if (startMins === endMins) {
  endMins += 1440;
} else if (endMins <= startMins) {
  endMins += 1440;
}


  let currentStart = startMins;

  while (currentStart + slotDurationMins <= endMins) {
    const slotStart = minutesToTime(currentStart);
    const slotEnd = minutesToTime(currentStart + slotDurationMins);

    slots.push({ start: slotStart, end: slotEnd });

    currentStart += stepMinutes;
  }

  return slots;
}
