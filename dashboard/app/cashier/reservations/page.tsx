"use client";

import { useOutletContext } from "@/components/providers/CashierOutletProvider";
import { useState } from "react";
import { ReservationForm } from "@/components/cashier/reservations/reservation-form";


export default function ReservationPage() {
    const { selectedOutletId: outletId } = useOutletContext()
    const [isFormOpen, setIsFormOpen] = useState(true)

    return (
        <ReservationForm
            outletId={outletId!}
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSuccess={() => { }}
        />
    )
}