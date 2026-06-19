"use client";

import React from "react";
import { gooeyToast } from "goey-toast";
import { ReusableForm } from "@/components/ui/reuseable-form";
import { Card } from "@/components/ui/card";
import { OutletType } from "@/types";
import { useActiveCashierShift, useOpenCashierShift } from "@/hooks/api/use-cashier-shifts";
import { openShiftSchema, type OpenShiftValues } from "@/lib/validations/cashier-shift.schema";

export function CashierShiftGate(props: {
  outletId: string;
  outletType: OutletType;
  children: React.ReactNode;
}) {
  const { outletId, outletType, children } = props;
  const { data: activeShift, isLoading } = useActiveCashierShift(outletId);
  const openShift = useOpenCashierShift();

  if (outletType !== OutletType.RETAIL) return <>{children}</>;
  if (isLoading) return null;
  if (activeShift) return <>{children}</>;

  return (
    <div className="min-h-[calc(100svh-10rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Buka Shift</h2>
          <p className="text-sm text-muted-foreground">
            Untuk outlet retail, shift wajib dibuka sebelum transaksi.
          </p>
        </div>

        <ReusableForm<OpenShiftValues>
          schema={openShiftSchema}
          defaultValues={{ openingCash: 0, notes: "" }}
          onSubmit={async (values) => {
            await openShift.mutateAsync({
              outletId,
              openingCash: values.openingCash,
              notes: values.notes,
            });
            gooeyToast.success("Shift berhasil dibuka");
          }}
          fields={[
            { name: "openingCash", label: "Opening Cash", type: "currency", colSpan: "full" },
            { name: "notes", label: "Catatan (opsional)", type: "textarea", colSpan: "full" },
          ]}
          submitText="Buka Shift"
          loadingText="Membuka..."
          isLoading={openShift.isPending}
          errorSummary
        />
      </Card>
    </div>
  );
}

