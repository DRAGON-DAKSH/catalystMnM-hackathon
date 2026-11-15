const IST = "+05:30";

/** Today's date in India as YYYY-MM-DD */
export function istDate(d = new Date()) {
  return new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** ISO timestamp for a "HH:MM" slot on an IST date */
export function slot(date: string, time: string) {
  return new Date(`${date}T${time}:00${IST}`).toISOString();
}

export function dayRange(date: string) {
  const start = slot(date, "00:00");
  const end = new Date(new Date(start).getTime() + 24 * 3600 * 1000).toISOString();
  return { start, end };
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}