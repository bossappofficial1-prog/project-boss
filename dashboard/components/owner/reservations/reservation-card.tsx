import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reservation } from "@/lib/apis/reservation";
import { format } from "date-fns";
import { Clock, Phone, User, Users } from "lucide-react";

const getStatusBadge = (status: string) => {
    switch (status) {
        case "RESERVED":
            return <Badge className="bg-blue-500">Reserved</Badge>;
        case "ON_GOING":
        case "PROCESSING":
            return <Badge className="bg-yellow-500">Active</Badge>;
        case "COMPLETED":
            return <Badge className="bg-green-500">Selesai</Badge>;
        case "CANCELLED":
            return <Badge variant="destructive">Batal</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export function ReservationCard({ reservation }: { reservation: Reservation }) {
    return (
        <Card
            key={reservation.id}
            className="group py-0 rounded-md border-border/80 bg-background shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
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
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}