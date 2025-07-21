import { format, addMinutes } from 'date-fns';

export const DateUtil = {
    now(): string {
        return new Date().toISOString();
    },

    formatDate(date: Date, fmt: string = 'yyyy-MM-dd HH:mm:ss'): string {
        return format(date, fmt);
    },

    addMinutes(date: Date, minutes: number): Date {
        return addMinutes(date, minutes);
    }
};
