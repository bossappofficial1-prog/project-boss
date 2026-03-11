const str = "2026-03-15T17:00:00.000Z";
const targetDate = new Date(str);
const startOfDay = new Date(targetDate);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(targetDate);
endOfDay.setHours(23, 59, 59, 999);
console.log("Input: ", str);
console.log("startOfDay: ", startOfDay.toISOString());
console.log("endOfDay: ", endOfDay.toISOString());
