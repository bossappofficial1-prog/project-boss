'use client'

import React, { useState } from 'react';
import {
    CreditCard,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    Star,
    Settings,
    Store
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useCreateSubscriptionPlans, useDeleteSubscriptionPlans, useSubscriptionPlans, useUpdateSubscriptionPlans } from '@/hooks/useSubscriptionPlan';
import { SubcriptionPlansForm } from './SubcriptionPlansForm';
import { subscriptionPlanvalues } from './schema';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type PlanFeatures = {
    maxOutlets: number; // -1 for unlimited
    maxProducts: number;
    maxStaff: number;
    canExportReport: boolean;
    supportLevel: 'EMAIL' | 'WHATSAPP' | 'PRIORITY';
};

type SubscriptionPlan = {
    id: string;
    name: string;
    code: string;
    price: number;
    durationDays: number;
    isActive: boolean;
    isPopular: boolean;
    features: PlanFeatures;
};

export default function SubscriptionPlansContent() {
    const { data: plans } = useSubscriptionPlans()
    const [mode, setMode] = useState<'create' | 'edit'>('create')
    const { mutateAsync: handleCreate, isPending: isCreateLoading } = useCreateSubscriptionPlans()
    const { mutateAsync: handleUpdate, isPending: isUpdateLoading } = useUpdateSubscriptionPlans()
    const { mutateAsync: handleDelete, isPending: isDeleteLoading } = useDeleteSubscriptionPlans()
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<subscriptionPlanvalues | null>(null);

    const handleSubmit = async (values: subscriptionPlanvalues) => {
        try {
            if (mode === 'create') {
                await handleCreate(values)
            } else {
                await handleUpdate({ id: selectedPlan?.id!, data: values })
            }

            setMode('create')
            setSelectedPlan(null)
            setIsEditorOpen(false)
        } catch (error) {
            throw error
        }
    }

    const handleDeleteClik = (plan: subscriptionPlanvalues) => {
        setSelectedPlan(plan)
        setIsConfirmDeleteOpen(true)
    }

    const handleOpenEditor = (plan?: SubscriptionPlan) => {
        if (plan) {
            setSelectedPlan(plan);
        } else {
            setSelectedPlan(null);
        }
        setIsEditorOpen(true);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-indigo-600" />
                        Manajemen Paket Langganan
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Atur harga, durasi, dan batasan fitur untuk setiap paket langganan.
                    </p>
                </div>
                <Button onClick={() => handleOpenEditor()} className="gap-2 shadow-indigo-100">
                    <Plus className="h-4 w-4" />
                    Buat Paket Baru
                </Button>
            </div>

            {/* PLANS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans?.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative p-6 rounded-xl border bg-background transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group border-t-4 ${plan.isActive ? "border-t-indigo-500" : "border-t-slate-300"
                            }`}
                    >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {plan.isPopular && (
                                <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                                    <Star className="h-3 w-3 mr-1 fill-amber-600" />
                                    Popular
                                </Badge>
                            )}

                            {!plan.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                    Draft
                                </Badge>
                            )}
                        </div>

                        {/* Header */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-foreground">
                                {plan.name}
                            </h3>

                            <code className="mt-1 inline-block text-[11px] text-muted-foreground font-mono bg-slate-100 px-2 py-0.5 rounded">
                                {plan.code}
                            </code>

                            {/* Price */}
                            <div className="mt-4 flex items-end gap-2">
                                {plan.promo > 0 && (
                                    <span className="text-sm line-through text-muted-foreground">
                                        {formatCurrency(plan.price)}
                                    </span>
                                )}

                                <span className="text-3xl font-bold text-foreground">
                                    {formatCurrency(plan.promo || plan.price)}
                                </span>

                                <span className="text-sm text-muted-foreground">
                                    / {plan.durationDays} hari
                                </span>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 mb-6 border-y border-slate-100 py-4">

                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Store className="h-4 w-4" />
                                    Max Outlet
                                </span>

                                <span className="font-semibold text-foreground">
                                    {(plan.features as any).maxOutlets === -1
                                        ? "Unlimited"
                                        : (plan.features as any).maxOutlets}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Max Produk
                                </span>

                                <span className="font-semibold text-foreground">
                                    {(plan.features as any).maxProducts === -1
                                        ? "Unlimited"
                                        : (plan.features as any).maxProducts}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Settings className="h-4 w-4" />
                                    Export Laporan
                                </span>

                                {(plan.features as any).canExportReport ? (
                                    <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-1 rounded-md">
                                        Enabled
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground font-semibold text-xs bg-slate-100 px-2 py-1 rounded-md">
                                        Disabled
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                className="flex-1 gap-2"
                                onClick={() => {
                                    setSelectedPlan(plan as any);
                                    setIsEditorOpen(true);
                                    setMode("edit");
                                }}
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit Plan
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClik(plan)}
                                className="hover:border-red-300 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-600" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <SubcriptionPlansForm
                mode={mode}
                isOpen={isEditorOpen}
                isLoading={isCreateLoading || isUpdateLoading}
                onOpenChange={(open) => {
                    setMode('create')
                    setIsEditorOpen(open)
                }}
                defaultValues={selectedPlan as any}
                onSubmit={handleSubmit}
            />

            {isConfirmDeleteOpen && selectedPlan && (
                <ConfirmDialog
                    open={isConfirmDeleteOpen}
                    onOpenChange={setIsConfirmDeleteOpen}
                    description={`Yakin menghapus "${selectedPlan.name}", tindak tidak dapat dibatalkan setelah berhasil.`}
                    title={'Konfirmasi Hapus'}
                    onCancel={() => {
                        setSelectedPlan(null)
                        setIsConfirmDeleteOpen(false)
                    }}
                    confirmLoading={isDeleteLoading}
                    onConfirm={() => handleDelete(selectedPlan.id!).then(() => true)}
                />
            )}
        </>
    );
}