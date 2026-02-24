"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PaymentConfirmContent from "@/components/cashier/payment-confirm/PaymentConfirmContent";
import TicketScanContent from "@/components/cashier/ticket-scan/TicketScanContent";

export default function PaymentAndTicketPage() {
  const [tab, setTab] = useState("payment");
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 w-full flex gap-2">
          <TabsTrigger value="payment" className="flex-1">Konfirmasi Pembayaran</TabsTrigger>
          <TabsTrigger value="ticket" className="flex-1">Scan Tiket</TabsTrigger>
        </TabsList>
        <TabsContent value="payment">
          <PaymentConfirmContent />
        </TabsContent>
        <TabsContent value="ticket">
          <TicketScanContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}