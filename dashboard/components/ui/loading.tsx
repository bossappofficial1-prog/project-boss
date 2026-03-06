export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
            <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <span className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
                {/* Logo / Icon placeholder */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-md bg-primary shadow-md">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                        />
                    </svg>
                </div>
            </div>

            {/* App name */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-semibold tracking-tight text-foreground">Boss Dashboard</span>
                <span className="text-sm text-muted-foreground">Memuat aplikasi...</span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
        </div>
    );
}