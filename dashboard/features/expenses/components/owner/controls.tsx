"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExpensesControlsProps {
	startISO: string;
	endISO: string;
	onRangeChange: (startISO: string, endISO: string) => void;
	onAdd?: () => void;
	hideAddButton?: boolean;
}

function safeDate(iso?: string) {
	if (!iso) return undefined;
	const parsed = new Date(iso);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function mergeISO(dateYmd: string, time: "start" | "end") {
	if (!dateYmd) return "";
	const d = new Date(`${dateYmd}T${time === "start" ? "00:00:00.000" : "23:59:59.999"}Z`);
	return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

const DISPLAY_FORMAT = "dd MMM yyyy";

export function ExpensesControls({ startISO, endISO, onRangeChange, onAdd, hideAddButton = false }: ExpensesControlsProps) {
	const [open, setOpen] = useState(false);

	const startDate = safeDate(startISO);
	const endDate = safeDate(endISO);
	const hasRange = Boolean(startDate && endDate && startDate <= endDate);
	const selectedRange = useMemo<DateRange | undefined>(() => {
		if (!startDate) return undefined;
		return {
			from: startDate,
			to: hasRange && endDate ? endDate : startDate,
		};
	}, [startDate, endDate, hasRange]);

	const formattedStart = startDate ? format(startDate, DISPLAY_FORMAT) : "Pilih";
	const formattedEnd = hasRange && endDate ? format(endDate, DISPLAY_FORMAT) : "-";

	const handleSelect = (range?: DateRange) => {
		if (!range?.from) return;

		const fromIso = mergeISO(format(range.from, "yyyy-MM-dd"), "start");
		if (!fromIso) return;

		if (!range.to) {
			const sameDayIso = mergeISO(format(range.from, "yyyy-MM-dd"), "end");
			onRangeChange(fromIso, sameDayIso || fromIso);
			return;
		}

		const toIso = mergeISO(format(range.to, "yyyy-MM-dd"), "end");
		if (!toIso) return;

		onRangeChange(fromIso, toIso);
		setOpen(false);
	};

	return (
		<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
			<div className="flex-1 flex items-center gap-4">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<button
							className="group flex flex-1 items-center justify-between gap-6 px-4 py-2 bg-background/50 hover:bg-background border border-border/40 hover:border-border/80 transition-all rounded-md shadow-none outline-none focus:ring-1 focus:ring-primary/20"
						>
							<div className="flex items-center gap-8">
								<div className="text-left">
									<p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Dari</p>
									<p className="text-xs font-bold text-foreground/80 tabular-nums">{formattedStart}</p>
								</div>
								<div className="h-6 w-px bg-border/40" />
								<div className="text-left">
									<p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Sampai</p>
									<p className="text-xs font-bold text-foreground/80 tabular-nums">{formattedEnd}</p>
								</div>
							</div>
							<CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0 border-border/80 shadow-2xl rounded-md" align="start">
						<Calendar
							mode="range"
							numberOfMonths={1}
							selected={selectedRange}
							defaultMonth={selectedRange?.from ?? new Date()}
							onSelect={handleSelect}
							initialFocus
						/>
					</PopoverContent>
				</Popover>
			</div>

			{!hideAddButton && onAdd && (
				<Button onClick={onAdd} className="font-bold text-xs uppercase tracking-widest h-10 shadow-none">
					<Plus className="h-4 w-4 mr-2" />
					Tambah Pengeluaran
				</Button>
			)}
		</div>
	);
}

export default ExpensesControls;

