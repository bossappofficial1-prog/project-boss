import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <div className="relative flex items-center justify-center">
        {/* Outer ring */}
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-primary/20" />
        {/* Logo */}
        <div className="relative h-18 w-18 p-3 overflow-hidden rounded-xl shadow-md">
          <Image
            src="/icon.svg"
            alt="Boss Logo"
            width={64}
            height={64}
            priority
          />
        </div>
      </div>

      {/* App name */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Boss Dashboard
        </span>
        <span className="text-sm text-muted-foreground">
          Memuat aplikasi...
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
