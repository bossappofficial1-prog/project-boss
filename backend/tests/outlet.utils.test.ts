import { describe, expect, it } from "bun:test";
import { getIsOutletOpen } from "../src/utils/outlet.utils";

describe("Outlet Utils Tests", () => {
    it("should handle date objects correctly in getIsOutletOpen", () => {
        const operatingHours = [
            {
                id: "1",
                dayOfWeek: new Date("2026-05-29T03:00:00Z").getUTCDay(), // match the day of today
                openTime: new Date("1970-01-01T01:00:00Z"), // 8:00 WIB
                closeTime: new Date("1970-01-01T10:00:00Z"), // 17:00 WIB
                isOpen: true,
                breakStart: new Date("1970-01-01T05:00:00Z"), // 12:00 WIB
                breakEnd: new Date("1970-01-01T06:00:00Z"), // 13:00 WIB
                outletId: "outlet-1",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        // 10:00 WIB (3:00 UTC) -> should be open and not in break
        const today = new Date("2026-05-29T03:00:00Z");
        const isOpen = getIsOutletOpen(operatingHours, today);
        expect(isOpen).toBe(true);

        // 12:30 WIB (5:30 UTC) -> should be closed due to break
        const todayBreak = new Date("2026-05-29T05:30:00Z");
        const isOpenBreak = getIsOutletOpen(operatingHours, todayBreak);
        expect(isOpenBreak).toBe(false);
    });

    it("should handle ISO string values for open/close/break times gracefully", () => {
        const operatingHours = [
            {
                id: "1",
                dayOfWeek: new Date("2026-05-29T03:00:00Z").getUTCDay(),
                openTime: "1970-01-01T01:00:00", // no Z, should auto-append Z
                closeTime: "1970-01-01T10:00:00Z",
                isOpen: true,
                breakStart: "1970-01-01T05:00:00.000Z",
                breakEnd: "1970-01-01T06:00:00",
                outletId: "outlet-1",
                createdAt: "2026-05-29T10:00:00",
                updatedAt: "2026-05-29T10:00:00Z"
            }
        ];

        // 10:00 WIB (3:00 UTC) -> should be open
        const today = new Date("2026-05-29T03:00:00Z");
        const isOpen = getIsOutletOpen(operatingHours, today);
        expect(isOpen).toBe(true);

        // 12:30 WIB (5:30 UTC) -> should be closed due to break
        const todayBreak = new Date("2026-05-29T05:30:00Z");
        const isOpenBreak = getIsOutletOpen(operatingHours, todayBreak);
        expect(isOpenBreak).toBe(false);
    });
});
