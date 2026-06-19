"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reservation } from "@/lib/apis/reservation";
import { format } from "date-fns";
import { Clock, Phone, User, Users, CheckCircle, XCircle, Play } from "lucide-react";
import { useUpdateReservationStatus } from "@/hooks/api/use-reservations";
import { gooeyToast } from "goey-toast";

const STATUS_ACTIONS: Record<string, { label: string; icon: typeof Play; nextStatus: string; variant?: "default" | "destructive" | "outline" }[]> = {
  RESERVED: [
    { label: "Konfirmasi", icon: Play, nextStatus: "ON_GOING", variant: "default" },
    { label: "Batalkan", icon: XCircle, nextStatus: "CANCELLED", variant: "destructive" },
  ],
  ON_GOING: [
    { label: "Selesai", icon: CheckCircle, nextStatus: "COMPLETED", variant: "default" },
    { label: "Batalkan", icon: XCircle, nextStatus: "CANCELLED", variant: "destructive" },
  ],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "RESERVED":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Reserved</Badge>;
    case "ON_GOING":
    case "PROCESSING":
      return <Badge className="bg-yellow-500 hover:bg-yellow-500">Active</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-500 hover:bg-green-500">Selesai</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Batal</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function ReservationCard({ reservation, outletId }: { reservation: Reservation; outletId?: string }) {
  const updateMutation = useUpdateReservationStatus();

  const handleStatusChange = (status: string) => {
    updateMutation.mutate(
      { id: reservation.id, status, outletId: outletId! },
      {
        onSuccess: (res) => gooeyToast.success(res.message),
        onError: (err: any) => gooeyToast.error(err?.response?.data?.message ?? "Gagal mengubah status"),
      }
    );
  };

  const actions = STATUS_ACTIONS[reservation.orderStatus] ?? [];

  return (
    <Card className="group py-0 rounded-md border-border/80 bg-background shadow-sm hover:shadow-md transition-all overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{reservation.guestCustomer?.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> {reservation.guestCustomer?.phone}
              </p>
            </div>
          </div>
          {getStatusBadge(reservation.orderStatus)}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Waktu</span>
            <div className="flex items-center gap-1 text-xs font-medium">
              <Clock className="w-3 h-3 text-primary" />
              {format(new Date(reservation.bookingDate), "HH:mm")} ({reservation.bookingDurationMinutes} mnt)
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Meja</span>
            <div className="flex items-center gap-1 text-xs font-medium">
              <Users className="w-3 h-3 text-primary" />
              {reservation.table?.name || "-"}
              {reservation.guestCount && <span className="text-muted-foreground">· {reservation.guestCount} org</span>}
            </div>
          </div>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {actions.map((action) => (
              <Button
                key={action.nextStatus}
                size="sm"
                variant={action.variant ?? "outline"}
                className="h-8 text-xs gap-1 flex-1"
                onClick={() => handleStatusChange(action.nextStatus)}
                disabled={updateMutation.isPending}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
