import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export const formatSelectedSlot = (dateStr: string, startTimeStr: string, endTimeStr: string) => {
    try {
        const date = parseISO(dateStr);
        const startTime = parseISO(startTimeStr);
        const endTime = parseISO(endTimeStr);
        return {
            date: format(date, "EEEE, dd MMMM yyyy", { locale: id }),
            time: `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`
        };
    } catch (e) {
        return { date: '-', time: '-' };
    }
};