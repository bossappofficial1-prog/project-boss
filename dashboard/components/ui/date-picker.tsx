"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react" // Tambahkan CalendarIcon

import { cn } from "@/lib/utils" // Gunakan utility cn bawaan shadcn
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value?: string;
    onValueChange: (date: string | undefined) => void;
    id?: string;
    placeholder?: string;
    className?: string;
    startYear?: number;
    endYear?: number;
    dateISOstring?: (value: string) => void;
    disabledDate?: (date: Date) => boolean;
}

export function DatePicker({
    onValueChange,
    value,
    dateISOstring,
    id,
    placeholder = "Pilih tanggal",
    className,
    startYear = 1900,
    endYear = new Date().getFullYear() + 5,
    disabledDate
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [valueDate, setValueDate] = React.useState<Date>()

    React.useEffect(() => {
        if (value) {
            setValueDate(new Date(value))
        }

        return () => setValueDate(new Date())
    }, [value, onValueChange])

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);

    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start h-11 text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {valueDate ? formatDate(valueDate) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={valueDate}
                    onSelect={(date) => {
                        onValueChange(date?.toISOString());
                        setOpen(false);
                    }}
                    disabled={disabledDate}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={startYear}
                    toYear={endYear}
                />
            </PopoverContent>
        </Popover>
    )
}