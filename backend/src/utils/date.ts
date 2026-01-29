import { format, addMinutes } from 'date-fns';

export const DateUtil = {
    now(): string {
        return new Date().toISOString();
    },

    formatDate(date: Date, fmt: string = 'd MMMM yyyy'): string {
        return format(date, fmt);
    },

    addMinutes(date: Date, minutes: number): Date {
        return addMinutes(date, minutes);
    }
};

type TimeSlot = {
    start: Date;
    end: Date;
};

export function generateTimeSlots(
    start: string,
    end: string,
    intervalMinutes: number,
    date: string // format: YYYY-MM-DD
): TimeSlot[] {
    const slots: TimeSlot[] = [];

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    let current = new Date(`${date}T${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}:00`);
    const endTime = new Date(`${date}T${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}:00`);

    while (current < endTime) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + intervalMinutes);

        if (slotEnd > endTime) break;

        slots.push({
            start: slotStart,
            end: slotEnd,
        });

        current = slotEnd;
    }

    return slots;
}

export const formatDateTime = (iso: string) => {
    const d = new Date(iso);

    return {
        date: d.toLocaleDateString('sv-SE'),
        time: d.toLocaleTimeString('id-ID', { hour12: false }),
    };
};
