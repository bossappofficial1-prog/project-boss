import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useRef } from "react";

type TabButtonProps<T = string> = {
  onValueChange?: (value: T) => void;
  value?: T;
  className?: string;
  tabs: Array<{ id: T; label: string; icon?: LucideIcon }>;
};

export function TabButton<T extends string | object = string>({
  tabs,
  onValueChange,
  value,
  className,
}: TabButtonProps<T>) {
  const isActive = (id: T) => JSON.stringify(id) === JSON.stringify(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (containerRef.current?.offsetLeft ?? 0);
    scrollLeft.current = containerRef.current?.scrollLeft ?? 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (containerRef.current?.offsetLeft ?? 0);
    const walk = x - startX.current;
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center bg-muted/60 rounded-lg border border-border/40 p-0.5 gap-0.5",
        "w-full lg:w-auto overflow-x-auto select-none",
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className,
      )}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={JSON.stringify(id)}
          onClick={() => !isDragging.current && onValueChange?.(id)}
          className={cn(
            "shrink-0 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap",
            isActive(id)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          {label}
        </button>
      ))}
    </div>
  );
}
