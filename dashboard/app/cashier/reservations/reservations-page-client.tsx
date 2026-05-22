"use client";

import { useOutletContext } from "@/components/providers/CashierOutletProvider";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, CalendarCheck } from "lucide-react";
import { ReservationForm } from "@/components/cashier/reservations/reservation-form";
import { useReservations } from "@/hooks/api/use-reservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationCard } from "@/components/owner/reservations/reservation-card";

export default function ReservationsPageClient() {
  const { selectedOutletId: outletId } = useOutletContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [date] = useState(format(new Date(), "yyyy-MM-dd"));
  const {
    data: reservations = [],
    isLoading,
    refetch,
  } = useReservations(outletId!, date);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservasi Meja</h1>
          <p className="text-muted-foreground text-sm">
            Kelola reservasi meja untuk{" "}
            {format(new Date(), "dd MMMM yyyy", { locale: id })}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Buat Reservasi
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground/70">
              Belum ada reservasi hari ini
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-70">
              Klik &quot;Buat Reservasi&quot; untuk menambah tamu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reservations.map((res) => (
            <ReservationCard key={res.id} reservation={res} />
          ))}
        </div>
      )}

      <ReservationForm
        outletId={outletId!}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
