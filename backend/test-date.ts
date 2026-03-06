import { startOfDay, endOfDay } from "date-fns";

const dateStr = "2026-03-06";
const refDate = new Date(dateStr);
console.log("refDate:", refDate.toISOString(), refDate.toString());

const start = startOfDay(refDate);
const end = endOfDay(refDate);

console.log("start:", start.toISOString(), start.toString());
console.log("end:", end.toISOString(), end.toString());
