import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useOwnerSubscriptionInvoices } from "@/hooks/api/use-owner-subscription";
import { cn, formatCurrency, formatISOStringDate } from "@/lib/utils";
import { PAYMENT_ACTIONABLE_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "./helper";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InvoiceHistorySectionProps {
    query: ReturnType<typeof useOwnerSubscriptionInvoices>;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export function InvoiceHistorySection({ query, page, limit, onPageChange }: InvoiceHistorySectionProps) {
    const rows = query.data?.data ?? [];

    return (
        <DataTable
            data={rows}
            columns={[
                {
                    header: 'Invoice',
                    accessorKey: 'invoiceNumber',
                },
                {
                    header: 'Paket',
                    accessorKey: 'plan',
                    cell(props) {
                        const invoice = props.row.original

                        return (
                            <div className="flex flex-col">
                                <span>{invoice.plan?.name ?? '-'}</span>
                                <span className="text-xs text-muted-foreground">{invoice.plan?.durationDays ?? '-'} hari</span>
                            </div>
                        )
                    },
                },
                {
                    header: 'Status',
                    cell(props) {
                        const invoice = props.row.original
                        return (
                            <Badge className={cn('border text-xs font-semibold', PAYMENT_STATUS_STYLES[invoice.status])}>
                                {PAYMENT_STATUS_LABELS[invoice.status]}
                            </Badge>
                        )
                    },
                },
                {
                    header: 'Nominal',
                    accessorKey: 'amount',
                    cell(props) {
                        const invoice = props.row.original

                        return formatCurrency(invoice.amount)
                    },
                },
                {
                    header: 'Tanggal',
                    accessorKey: 'createdAt',
                    cell(props) {
                        const invoice = props.row.original

                        return (
                            <div className="flex flex-col text-xs text-muted-foreground">
                                <span>{formatISOStringDate(invoice.createdAt)}</span>
                                {invoice.paidAt && <span>Dibayar {formatISOStringDate(invoice.paidAt)}</span>}
                            </div>
                        )
                    },
                }
            ]}
            actionViewType="flex"
            rowActions={() => [
                {
                    render(row) {
                        return PAYMENT_ACTIONABLE_STATUSES.includes(row.status) ? (
                            <Button asChild size="sm" variant="outline">
                                <Link href={`/subscription/payment/${row.id}`}>
                                    Lanjutkan
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="sm" variant="ghost">
                                <Link href={`/subscription/payment/${row.id}`}>
                                    Detail
                                </Link>
                            </Button>
                        )
                    },
                }
            ]}
        />
    );
}