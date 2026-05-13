"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function Clocks() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-lg font-black tabular-nums tracking-tighter leading-none">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>
    );
}