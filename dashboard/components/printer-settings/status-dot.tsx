import { cn } from "@/lib/utils";

export function StatusDot({ connected }: { connected: boolean }) {
    return (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
            {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D9E75] opacity-50" />
            )}
            <span
                className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    connected ? "bg-[#1D9E75]" : "bg-border"
                )}
            />
        </span>
    );
}
