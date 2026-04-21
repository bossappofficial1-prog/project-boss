import { usePrinterContext } from "@/contexts/PrinterContext";
import { posV2Api } from "@/lib/apis/pos-v2";
import React from "react";
import { toast } from "sonner";

export const usePrint = () => {
    const [isPrinting, setIsPrinting] = React.useState(false);
    const printer = usePrinterContext();

    const handlePrintReceipt = async (orderId: string) => {
        setIsPrinting(true);
        try {
            if (printer.isConnected) {
                const arrayBuffer = await posV2Api.getReceiptPrint(orderId);
                const success = await printer.printRaw(new Uint8Array(arrayBuffer));

                if (success) {
                    toast.success("Struk berhasil dicetak!");
                }
                setIsPrinting(false);
                return;
            }

            const blob = await posV2Api.getReceipt(orderId);
            const url = URL.createObjectURL(blob);

            const printWindow = window.open(url, "_blank", "width=400,height=600");
            if (printWindow) {
                printWindow.addEventListener("load", () => {
                    printWindow.print();
                });
            } else {
                const a = document.createElement("a");
                a.href = url;
                a.download = `receipt-${orderId}.pdf`;
                a.click();
                toast.info("PDF struk sudah diunduh");
            }

            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            console.error("Failed to print receipt:", error);
            toast.error("Gagal mencetak struk");
        } finally {
            setIsPrinting(false);
        }
    };

    const handlePrintTickets = async (orderId: string) => {
        try {
            setIsPrinting(true);
            const blob = await posV2Api.printOrderTickets(orderId);
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (error) {
            console.error("Failed to print tickets:", error);
            toast.error("Gagal mencetak tiket");
        } finally {
            setIsPrinting(false);
        }
    };

    return {
        handlePrintReceipt,
        isPrinting,
        setIsPrinting,
        handlePrintTickets
    }
}