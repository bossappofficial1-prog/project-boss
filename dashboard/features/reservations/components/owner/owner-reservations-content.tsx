"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarCheck, CalendarDays } from "lucide-react";
import { useOutletStore } from "@/stores/outlet.store";
import { useReservations } from "@/hooks/api/use-reservations";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ReservationCard } from "./reservation-card";
import { DatePicker } from "@/components/ui/date-picker";

export default function OwnerReservationsContent() {
  const { selectedOutletId, isLoading: outletLoading } = useOutletStore();
  const router = useRouter();
  const [date, setDate] = useState<string | undefined>(undefined);

  const { data: reservations = [], isLoading } = useReservations(selectedOutletId!, date);
  const activeReservations = reservations.filter(
    (r: any) => r.orderStatus === "RESERVED" || r.orderStatus === "ON_GOING",
  );

  if (outletLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedOutletId) {
    return <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Daftar Reservasi Meja"
        description="Pantau semua reservasi meja untuk outlet Anda."
        actions={
          <div className="flex items-center gap-2">
            <DatePicker
              value={date ?? ""}
              onValueChange={(d) => setDate(d || undefined)}
              placeholder="Filter tanggal"
            />
            {date && (
              <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
                Reset
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground/70">
              {date ? "Tidak ada reservasi di tanggal ini" : "Belum ada reservasi"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {date ? "Coba pilih tanggal lain." : "Reservasi akan muncul di sini setelah dibuat oleh kasir."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Menampilkan {reservations.length} reservasi
            {activeReservations.length > 0 && (
              <span className="ml-1">
                · {activeReservations.length} aktif
              </span>
            )}
            {date && (
              <span className="ml-1">
                · {format(new Date(date), "dd MMMM yyyy", { locale: id })}
              </span>
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reservations.map((res) => (
              <ReservationCard key={res.id} reservation={res} outletId={selectedOutletId!} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
