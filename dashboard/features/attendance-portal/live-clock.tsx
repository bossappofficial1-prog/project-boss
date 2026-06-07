"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-center select-none">
      <p className="font-mono text-5xl font-bold text-foreground tracking-tight">
        {format(now, "HH:mm:ss")}
      </p>
      <p className="text-sm text-muted-foreground mt-1 capitalize">
        {format(now, "EEEE, d MMMM yyyy", { locale: localeId })}
      </p>
    </div>
  );
}
