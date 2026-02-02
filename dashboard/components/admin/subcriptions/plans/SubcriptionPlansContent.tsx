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
import { Input } from '@/components/ui/input';
import { useCreateSubscriptionPlans, useDeleteSubscriptionPlans, useSubscriptionPlans, useUpdateSubscriptionPlans } from '@/hooks/useSubscriptionPlan';
import { SubcriptionPlansForm } from './SubcriptionPlansForm';
import { subscriptionPlanvalues } from './schema';
import { toast } from 'sonner';
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
                    <Card key={plan.id} className={`p-6 relative group border-t-4 ${plan.isActive ? 'border-t-indigo-500' : 'border-t-slate-300'}`}>

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {plan.isPopular && (
                                <Badge variant="warning" >
                                    <Star className="h-3 w-3 mr-1 fill-amber-700" /> Popular
                                </Badge>
                            )}
                            {!plan.isActive && <Badge variant="secondary">Draft</Badge>}
                        </div>

                        {/* Plan Header */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                            <code className="text-[10px] text-muted-foreground/90 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{plan.code}</code>
                            <div className="mt-3 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-foreground">{formatCurrency(plan.price)}</span>
                                <span className="text-sm text-muted-foreground">/ {plan.durationDays} hari</span>
                            </div>
                        </div>

                        {/* Features Preview */}
                        <div className="space-y-3 mb-6 border-t border-b border-slate-100 py-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Store className="h-4 w-4" /> Max Outlets</span>
                                <span className="font-semibold">{(plan.features as any).maxOutlets === -1 ? 'Unlimited' : (plan.features as any).maxOutlets}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Max Produk</span>
                                <span className="font-semibold">{(plan.features as any).maxProducts === -1 ? 'Unlimited' : (plan.features as any).maxProducts}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2"><Settings className="h-4 w-4" /> Export Laporan</span>
                                {(plan.features as any).canExportReport ? (
                                    <span className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded">Yes</span>
                                ) : (
                                    <span className="text-muted-foreground/90 font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded">No</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                                setSelectedPlan(plan as any);
                                setIsEditorOpen(true)
                                setMode('edit')
                            }}>
                                <Edit3 className="h-4 w-4" /> Edit
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { handleDeleteClik(plan) }}>
                                <Trash2 className="h-4 w-4 text-muted-foreground/90 hover:text-red-600" />
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