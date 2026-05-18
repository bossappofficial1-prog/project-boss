"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarCheck, Clock, Users, Phone, User, CheckCircle, XCircle } from "lucide-react";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useReservations } from "@/hooks/api/use-reservations";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { ReservationCard } from "./reservation-card";

export default function OwnerReservationsContent() {
  const { selectedOutletId, isLoading: outletLoading } = useOutletContext();
  const router = useRouter();
  const [date] = useState(format(new Date(), "yyyy-MM-dd")); // Today

  const { data: reservations = [], isLoading } = useReservations(selectedOutletId!, date);

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
        description={`Pantau reservasi meja untuk outlet Anda pada tanggal ${format(new Date(), "dd MMMM yyyy", { locale: id })}.`}
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
            <p className="text-sm font-bold text-foreground/70">Belum ada reservasi hari ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reservations.map((res) => <ReservationCard key={res.id} reservation={res} />)}
        </div>
      )}
    </div>
  );
}
