interface DateGroupHeaderProps {
    label: string;
    count: number;
}

export default function DateGroupHeader({ label, count }: DateGroupHeaderProps) {
    return (
        <div className="flex items-center gap-3 px-1 py-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
                {label}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground shrink-0">{count}</span>
        </div>
    );
}
