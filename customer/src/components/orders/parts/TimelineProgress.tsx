import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
    status: string;
    label: string;
};

type Props = {
    timelineSteps: Step[];
    currentIndex: number;
};

export default function TimelineProgress({ timelineSteps, currentIndex }: Props) {
    const itemsPerRow = timelineSteps.length > 6 ? 4 : 3;

    return (
        <div>
            <style>{`
                .timeline-grid {
                    grid-template-columns: repeat(${itemsPerRow}, minmax(0, 1fr));
                }
                @media (min-width: 640px) {
                    .timeline-grid {
                        grid-template-columns: repeat(${timelineSteps.length}, minmax(0, 1fr));
                    }
                }
            `}</style>

            <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
                <div className="timeline-grid grid gap-y-10 relative">
                    {timelineSteps.map((step, idx) => {
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        const isLast = idx === timelineSteps.length - 1;
                        const isEndOfRow = (idx + 1) % itemsPerRow === 0;
                        const hasNextRow = idx + itemsPerRow < timelineSteps.length;

                        return (
                            <div key={step.status} className="flex flex-col items-center relative">
                                {/* DOT */}
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all",
                                        isCompleted
                                            ? "bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                                            : "bg-muted border-2 border-border",
                                        isCurrent && "ring-2 ring-offset-2 ring-primary/40"
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                                    ) : (
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {idx + 1}
                                        </span>
                                    )}
                                </div>

                                {/* LABEL */}
                                <span
                                    className={cn(
                                        "text-[10px] text-center mt-2 max-w-[70px] leading-tight",
                                        isCurrent
                                            ? "font-bold text-foreground"
                                            : isCompleted
                                                ? "text-muted-foreground"
                                                : "text-muted-foreground/60"
                                    )}
                                >
                                    {step.label}
                                </span>

                                {/* HORIZONTAL CONNECTOR
                                    - Selalu tampil di desktop (kecuali item terakhir)
                                    - Di mobile: sembunyikan di ujung row  */}
                                {!isLast && (
                                    <div
                                        className={cn(
                                            "absolute top-[11px] h-[2px]",
                                            isEndOfRow ? "hidden sm:block" : "block",
                                            idx < currentIndex ? "bg-primary" : "bg-border"
                                        )}
                                        style={{
                                            left: "calc(50% + 12px)",
                                            right: "calc(-50% + 12px)",
                                        }}
                                    />
                                )}

                                {/* VERTICAL CONNECTOR — mobile only, ujung tiap row */}
                                {isEndOfRow && hasNextRow && (
                                    <div
                                        className={cn(
                                            "absolute w-[2px] sm:hidden",
                                            idx < currentIndex ? "bg-primary" : "bg-border"
                                        )}
                                        style={{
                                            top: "12px",
                                            left: "50%",
                                            height: "calc(100% + 2.5rem)",
                                            transform: "translateX(-50%)",
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}