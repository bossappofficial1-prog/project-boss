"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface DateTimePickerProps {
    id?: string;
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    disabled?: boolean;
    label?: string;
    error?: string;
    placeholder?: string;
    className?: string;
}

export function DateTimePicker({
    value,
    id,
    onChange,
    disabled,
    label,
    error,
    placeholder = "Pilih tanggal & waktu",
    className,
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
    const [timeValue, setTimeValue] = React.useState<string>("00:00");

    React.useEffect(() => {
        setSelectedDate(value);
        if (value) {
            setTimeValue(format(value, "HH:mm"));
        }
    }, [value]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            setSelectedDate(undefined);
            onChange?.(undefined);
            return;
        }

        const [hours, minutes] = timeValue.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours || 0, minutes || 0, 0, 0);

        setSelectedDate(newDate);
        onChange?.(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTimeValue(newTime);

        if (selectedDate) {
            const [hours, minutes] = newTime.split(":").map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours || 0, minutes || 0, 0, 0);
            setSelectedDate(newDate);
            onChange?.(newDate);
        }
    };

    return (
        <div className={cn("w-full space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}
            <Popover>
                <PopoverTrigger id={id} asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                            error && "border-destructive focus-visible:ring-destructive"
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                            format(selectedDate, "PPP - HH:mm", { locale: localeId })
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    {/* Input Waktu Kustom */}
                    <div className="p-3 border-t border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">Waktu:</span>
                            <Input
                                type="time"
                                value={timeValue}
                                onChange={handleTimeChange}
                                className="h-8 w-[120px] ml-auto"
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {error && (
                <p className="text-xs font-medium text-destructive mt-1">{error}</p>
            )}
        </div>
    );
}