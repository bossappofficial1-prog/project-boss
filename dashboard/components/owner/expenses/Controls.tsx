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
	onAdd: () => void;
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

const DISPLAY_FORMAT = "d MMM yyyy";

export function ExpensesControls({ startISO, endISO, onRangeChange, onAdd }: ExpensesControlsProps) {
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

	const formattedStart = startDate ? format(startDate, DISPLAY_FORMAT) : "Pilih tanggal";
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
		<div className="flex flex-col sm:flex-row gap-4">
			<div className="flex-1 space-y-2">
				<Label className="text-xs font-medium uppercase text-muted-foreground">Rentang Tanggal</Label>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="h-auto w-full items-stretch justify-start gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left"
						>
							<div className="flex w-full items-center gap-4">
								<div className="flex-1">
									<p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Mulai</p>
									<p className="text-sm font-semibold text-foreground">{formattedStart}</p>
								</div>
								<div className="h-10 w-px bg-border" />
								<div className="flex-1">
									<p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Selesai</p>
									<p className="text-sm font-semibold text-foreground">{formattedEnd}</p>
								</div>
								<CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
							</div>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
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

			<div className="sm:w-60 flex items-end">
				<Button onClick={onAdd} variant="default" className="w-full sm:w-auto">
					<Plus className="h-4 w-4" />
					Tambah Pengeluaran
				</Button>
			</div>
		</div>
	);
}

export default ExpensesControls;

