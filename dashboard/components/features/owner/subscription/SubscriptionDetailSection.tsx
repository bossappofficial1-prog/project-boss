import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLimitLabel, getDaysRemaining, parsePlanFeatures, SUBSCRIPTION_STATUS_LABELS, SUBSCRIPTION_STATUS_STYLES } from "./helper";
import { cn, formatCurrency, formatISOStringDate } from "@/lib/utils";
import { ArrowRight, Clock3, CreditCard, FileText, Loader2, Package2, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerSubscriptionOverviewResponse } from "@/lib/apis/owner-subscription";
import { useMemo } from "react";
import { formatDateTime } from "@/components/owner/orders/utils";

type Props = {
    data: OwnerSubscriptionOverviewResponse
    handleRenew: () => void
    isRenewLoading: boolean
}

export function SubscriptionDetailSection({
    data,
    handleRenew,
    isRenewLoading
}: Props) {
    const overview = data;
    const plan = overview?.plan ?? null;
    const usage = overview?.usage;
    const planFeatures = useMemo(() => parsePlanFeatures(plan?.features), [plan?.features]);
    const endsAt = overview?.business?.subscriptionEndDate ?? usage?.subscription?.endsAt ?? null;
    const daysLeft = getDaysRemaining(endsAt);
    return (
        <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <Card>
                <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <CardTitle className="text-2xl font-semibold text-foreground dark:text-gray-100">
                                {plan?.name ?? 'Paket Tidak Diketahui'}
                            </CardTitle>
                            {overview.business?.subscriptionStatus && (
                                <Badge className={cn('border text-xs font-semibold', SUBSCRIPTION_STATUS_STYLES[overview.business.subscriptionStatus])}>
                                    {SUBSCRIPTION_STATUS_LABELS[overview.business.subscriptionStatus]}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Berlaku selama {plan?.durationDays ?? '-'} hari • {plan?.code}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Biaya langganan</p>
                        <p className="text-3xl font-bold text-red-600">{plan ? formatCurrency(plan.price) : '-'}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-md border border-red-100/20 bg-white/10 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktif sejak</p>
                            <p className="text-sm font-semibold text-foreground">
                                {formatISOStringDate(overview.business?.subscriptionStartDate ?? '-')}
                            </p>
                        </div>
                        <div className="rounded-md border border-red-100/20 bg-white/10 p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Berakhir pada</p>
                            <p className="text-sm font-semibold text-foreground">
                                {endsAt ? formatISOStringDate(endsAt) : '-'}
                            </p>
                        </div>
                        <div className="rounded-md border border-red-100/20 bg-white/10 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Sisa waktu</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {daysLeft === null ? '-' : daysLeft === 0 ? 'Berakhir hari ini' : `${daysLeft} hari`}
                                </p>
                            </div>
                            <ShieldCheck className="h-8 w-8 text-red-500" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 rounded-md border border-slate-100/20 bg-white/10 p-4 text-sm text-card-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>{overview.business?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                            <Clock3 className="h-4 w-4" />
                            <span>Status diterbitkan pada {formatDateTime(overview.business?.subscriptionStartDate ?? '')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card >
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Fitur Paket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-card-foreground">
                    {planFeatures ? (
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Outlet</p>
                                    <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxOutlets)}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Package2 className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Produk & layanan</p>
                                    <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxProducts)}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <Users className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Tim staf</p>
                                    <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxStaff)}</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Ekspor laporan</p>
                                    <p className="text-muted-foreground">
                                        {planFeatures.canExportReport ? 'Semua laporan dapat diunduh' : 'Ekspor laporan tidak tersedia'}
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <ReceiptText className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Level dukungan</p>
                                    <p className="text-muted-foreground">
                                        {planFeatures.supportLevel === 'PRIORITY'
                                            ? 'Prioritas (Direct channel)'
                                            : planFeatures.supportLevel === 'WHATSAPP'
                                                ? 'Chat WhatsApp bisnis'
                                                : 'Email support'}
                                    </p>
                                </div>
                            </li>
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">Fitur paket tidak tersedia.</p>
                    )}
                    <Button variant="secondary" className="w-full mt-4" onClick={handleRenew} disabled={!plan || isRenewLoading}>
                        {isRenewLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                        )}
                        Perpanjang paket ini
                    </Button>
                </CardContent>
            </Card>
        </section>
    )
}