"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { AdminDashboardRiskRecord } from "@/lib/apis/admin-dashboard";

interface RiskyMerchantsTableProps {
    data?: AdminDashboardRiskRecord[];
    isLoading: boolean;
}

const formatRelativeTime = (date?: string) => {
    if (!date) return "-";
    const target = new Date(date).getTime();
    const diff = target - Date.now();
    const formatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
    const minutes = Math.round(diff / 60000);
    if (Math.abs(minutes) < 60) return formatter.format(Math.round(minutes), "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
    const days = Math.round(hours / 24);
    return formatter.format(days, "day");
};

export function RiskyMerchantsTable({ data = [], isLoading }: RiskyMerchantsTableProps) {
    return (
        <Card className="border border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Merchant berisiko tinggi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Semua merchant aman saat ini.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bisnis</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead className="text-center">Pending</TableHead>
                                    <TableHead className="text-center">Ditolak</TableHead>
                                    <TableHead className="text-right">Outstanding</TableHead>
                                    <TableHead className="text-right">Aktivitas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((merchant) => (
                                    <TableRow key={merchant.businessId}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{merchant.business?.name ?? "-"}</span>
                                                <span className="text-xs text-muted-foreground">{merchant.business?.subscriptionStatus ?? "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{merchant.business?.owner?.name ?? "-"}</span>
                                                <span className="text-xs text-muted-foreground">{merchant.business?.owner?.email ?? "-"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="rounded-full">
                                                {merchant.pendingInvoices}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="rounded-full text-red-600">
                                                {merchant.rejectedInvoices}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(merchant.outstandingAmount)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {formatRelativeTime(merchant.lastActivityAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
