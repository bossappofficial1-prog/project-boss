'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Business, SubscriptionStatus, useBusiness, useKPIsBusiness } from "@/hooks/useBusiness"
import { AlertCircle, ArrowRight, Ban, Building2, CheckCircle2, Clock, CreditCard, Download, Mail, Phone, Save, ShieldAlert, Store, User } from "lucide-react"
import { useState } from "react"
import { AllBusinessTable } from "./AllBusinessTable"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AllBusinessForm } from "./AllBusinessForm"
import { KpiCard, MetaFooterKPIs } from "@/components/shared/KPISCard"
import { KPIGrowth } from "@/types/kpis"
import { cn, formatNumberCompactID } from "@/lib/utils"
import ReusableSheet from "@/components/ui/reuseable-sheet"

export function AllBusinessContent() {
    const [nameParams, setNameParams] = useState('')
    const [subsStatusParams, setSubsStatusParams] = useState<SubscriptionStatus>('ALL')

    const { data: kpisData, isLoading: kpisLoading } = useKPIsBusiness()
    const { data: businesses, isRefetching, refetch } = useBusiness({ name: nameParams, status: subsStatusParams })
    const [selectedTenant, setSelectedTenant] = useState<Business | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    function GrowthFooter({ growth }: { growth: KPIGrowth }) {
        if (!growth || growth.direction === "new") {
            return (
                <span className="text-muted-foreground">
                    New this month
                </span>
            )
        }

        const isUp = growth.direction === "up"

        return (
            <div
                className={cn(
                    "flex items-center gap-1",
                    isUp ? "text-success" : "text-destructive"
                )}
            >
                <ArrowRight
                    className={cn(
                        "h-4 w-4",
                        isUp ? "-rotate-45" : "rotate-45"
                    )}
                />
                <span className="font-medium">
                    {Math.abs(growth.percentage!)}%
                </span>
                <span className="text-muted-foreground">
                    {growth.label}
                </span>
            </div>
        )
    }
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Tenant Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor dan kelola bisnis yang terdaftar di platform Anda.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <KpiCard
                    icon={<Store className="h-6 w-6" />}
                    isLoading={kpisLoading}
                    title="Total Merchants"
                    value={kpisData?.totalMerchants.value ?? 0}
                    footer={<GrowthFooter growth={kpisData?.totalMerchants.growth!} />}
                />

                <KpiCard
                    isLoading={kpisLoading}
                    title="Subscription Revenue"
                    value={formatNumberCompactID(kpisData?.subscriptionRevenue.value ?? 0)}
                    icon={<CreditCard className="h-6 w-6" />}
                    footer={
                        <MetaFooterKPIs
                            value={kpisData?.subscriptionRevenue.meta?.expiringSoon as number}
                            label="subscriptions expiring soon"
                        />
                    }
                />

                <KpiCard
                    isLoading={kpisLoading}
                    title="Platform Health"
                    value={`${kpisData?.platformHealth.value}%`}
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    footer={
                        <MetaFooterKPIs
                            value={kpisData?.platformHealth.meta?.suspendedAccounts as number}
                            label="suspended accounts"
                            variant="danger"
                        />
                    }
                />
            </div>

            <AllBusinessTable
                onEdit={(tenant) => {
                    setIsSheetOpen(true)
                    setSelectedTenant(tenant)
                }}
                data={businesses || []}
                onSearchChange={setNameParams}
                isRefreshing={isRefetching}
                onRefresh={refetch}
            />

            <ReusableSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                showFooter
                cancelText="Tutup"
                side="right"
                preventCloseOnOverlayClick
                confirmVariant="destructive"
                onConfirm={() => { }}
                footer={<>
                    <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                    <Button type="submit" className="gap-2" form="businesses-form">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                </>}
                size="md"
                title={'Edit Tenant Details'}
                description={` Update informasi bisnis, status langganan, dan akses untuk ${selectedTenant?.name}.`}
                children={selectedTenant && (
                    <AllBusinessForm
                        key={selectedTenant.id}
                        onSubmit={(valueses) => console.log(valueses)}
                        initialValues={{
                            ...selectedTenant,
                            subscriptionEndDate: selectedTenant.subscriptionEndDate
                                ? new Date(selectedTenant.subscriptionEndDate)
                                : undefined,
                        }}
                    />
                )}
            />

            <Sheet open={false} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="sm:max-w-xl w-full md:w-[90vw] overflow-y-auto p-0 gap-0">
                    <SheetHeader>
                        <SheetTitle>Edit Tenant Details</SheetTitle>
                        <SheetDescription>
                            Update informasi bisnis, status langganan, dan akses untuk <strong>{selectedTenant?.name}</strong>.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedTenant && (
                        <>
                            <div className="flex-1 overflow-y-auto py-4 space-y-6 p-6">
                                <AllBusinessForm
                                    key={selectedTenant.id}
                                    onSubmit={(valueses) => console.log(valueses)}
                                    initialValues={{
                                        ...selectedTenant,
                                        subscriptionEndDate: selectedTenant.subscriptionEndDate
                                            ? new Date(selectedTenant.subscriptionEndDate)
                                            : undefined,
                                    }}
                                />
                            </div>
                        </>
                    )}
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button type="submit" className="gap-2" form="businesses-form">
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    )
}