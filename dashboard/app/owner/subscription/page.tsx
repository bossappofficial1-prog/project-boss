'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  useOwnerSubscriptionInvoices,
  useOwnerSubscriptionOverview,
  useRenewSubscription,
  useCancelSubscriptionInvoice,
  useSwitchBillingCycle,
} from '@/hooks/api/use-owner-subscription';
import { InvoiceHistorySection } from '@/features/owner/subscription/invoice-history-section';
import { SubscriptionSkeleton } from '@/features/owner/subscription/subscription-skeleton';
import { SubscriptionDetailSection } from '@/features/owner/subscription/subscription-detail-section';
import { OwnerSubscriptionHeader } from '@/features/owner/subscription/owner-subscription-header';
import { UsageGrid } from '@/features/owner/subscription/usage-grid';
import { PendingInvoiceCard } from '@/features/owner/subscription/pending-invoice-card';
import { NoPendingInvoiceCard } from '@/features/owner/subscription/no-pending-invoice-card';
import { EmptySubscriptionState } from '@/features/owner/subscription/empty-subscription-state';
import { PlanSelectorDialog } from '@/features/owner/subscription/plan-selector-dialog';
import { useSubscriptionPlans } from '@/hooks/use-subscription-plan';
import ConfirmationModal from '@/components/ui/confirmation-modal';

const PAGE_SIZE = 6;

export default function OwnerSubscriptionPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceIdToCancel, setInvoiceIdToCancel] = useState<string | null>(null);
  const limit = PAGE_SIZE;

  const overviewQuery = useOwnerSubscriptionOverview();
  const invoicesQuery = useOwnerSubscriptionInvoices({ page, limit });
  const renewMutation = useRenewSubscription();
  const cancelMutation = useCancelSubscriptionInvoice();
  const switchBillingCycleMutation = useSwitchBillingCycle();
  const plansQuery = useSubscriptionPlans();

  const overview = overviewQuery.data;
  const plan = overview?.plan ?? null;
  const usage = overview?.usage;
  const pendingInvoice = overview?.pendingInvoice ?? null;
  const planOptions = useMemo(
    () => (plansQuery.data ?? []).filter((p) => p.isActive && p.code !== 'TRIAL'),
    [plansQuery.data],
  );
  const shouldForcePlanSelection = !plan || plan?.code === 'TRIAL' || overview?.business?.subscriptionStatus === 'TRIAL';

  const totalPages = Math.max(invoicesQuery.data?.totalPages ?? 1, 1);
  const overviewErrorMessage =
    overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : (overviewQuery.error as unknown as { message?: string })?.message;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (planModalOpen && planOptions.length > 0) {
      setSelectedPlanCode((prev) =>
        prev ?? planOptions.find((p) => p.code !== 'TRIAL')?.code ?? planOptions[0].code ?? null,
      );
    }
  }, [planModalOpen, planOptions]);

  const startRenew = async (planCodeOverride?: string | null, billingCycle?: number) => {
    if (renewMutation.isPending) return;
    const targetPlanCode = planCodeOverride ?? plan?.code;
    if (!targetPlanCode) return;

    try {
      const result = await renewMutation.mutateAsync({ planCode: targetPlanCode, billingCycle });
      if (result?.invoice?.id) {
        router.push(`/subscription/payment/${result.invoice.id}`);
      }
    } catch {
      /* toast handled inside hook */
    }
  };

  const openPlanModal = () => {
    const fallbackCode = planOptions.find((p) => p.code !== 'TRIAL')?.code ?? planOptions[0]?.code ?? plan?.code ?? null;
    setSelectedPlanCode(fallbackCode ?? null);
    setPlanModalOpen(true);
  };

  const handleRenew = async () => {
    if (shouldForcePlanSelection || !plan) {
      openPlanModal();
      return;
    }

    await startRenew(plan.code, 30);
  };

  const handleConfirmPlan = async (billingCycle: number) => {
    if (!selectedPlanCode) return;
    await startRenew(selectedPlanCode, billingCycle);
    setPlanModalOpen(false);
  };

  const handleRefresh = () => {
    overviewQuery.refetch();
    invoicesQuery.refetch();
  };

  const handleCancelInvoice = (invoiceId: string) => {
    setInvoiceIdToCancel(invoiceId);
    setCancelModalOpen(true);
  };

  const onConfirmCancel = async () => {
    if (!invoiceIdToCancel) return;
    try {
      await cancelMutation.mutateAsync(invoiceIdToCancel);
      setCancelModalOpen(false);
      setInvoiceIdToCancel(null);
    } catch {
      // Error handled in hook
    }
  };

  const handleSwitchBillingCycle = async (newCycle: number) => {
    if (!overview?.business?.id) return;
    try {
      await switchBillingCycleMutation.mutateAsync({ billingCycle: newCycle });
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <OwnerSubscriptionHeader
        onRefresh={handleRefresh}
        onChangePlan={openPlanModal}
        onRenew={handleRenew}
        isRefreshing={overviewQuery.isFetching || invoicesQuery.isFetching}
        canChangePlan={!plansQuery.isLoading && planOptions.length > 0}
        canRenew={!renewMutation.isPending && (planOptions.length > 0 || !!plan)}
        isRenewLoading={renewMutation.isPending}
      />

      {overviewQuery.error && (
        <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-400 shadow-sm animate-shake">
          <div className="p-1.5 rounded-md bg-background border border-rose-200">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Gagal Memuat Data Langganan</p>
            <p className="text-[10px] font-medium opacity-80">{overviewErrorMessage ?? 'Coba segarkan ulang halaman.'}</p>
          </div>
        </div>
      )}

      {overviewQuery.isLoading ? (
        <SubscriptionSkeleton />
      ) : overview ? (
        <>
          <SubscriptionDetailSection
            handleRenew={handleRenew}
            isRenewLoading={renewMutation.isPending}
            data={overviewQuery.data}
            onSwitchBillingCycle={handleSwitchBillingCycle}
            isSwitchingBillingCycle={switchBillingCycleMutation.isPending}
          />

          {usage && <UsageGrid usage={usage} />}

          <section>
            {pendingInvoice ? (
              <PendingInvoiceCard pendingInvoice={pendingInvoice} onCancel={handleCancelInvoice} isCancelling={cancelMutation.isPending} />
            ) : (
              <NoPendingInvoiceCard onRenew={handleRenew} disabled={renewMutation.isPending || (!plan && planOptions.length === 0)} loading={renewMutation.isPending} />
            )}
          </section>

          <InvoiceHistorySection
            query={invoicesQuery}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onCancelInvoice={handleCancelInvoice}
          />
        </>
      ) : (
        <EmptySubscriptionState onRefresh={handleRefresh} />
      )}

      <PlanSelectorDialog
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        planOptions={planOptions}
        selectedPlanCode={selectedPlanCode}
        onSelectPlan={(code) => setSelectedPlanCode(code)}
        isLoading={plansQuery.isLoading}
        isConfirming={renewMutation.isPending}
        shouldForcePlanSelection={shouldForcePlanSelection}
        onConfirm={handleConfirmPlan}
      />

      <ConfirmationModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Batalkan Invoice"
        description="Apakah Anda yakin ingin membatalkan invoice ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        confirmVariant="destructive"
        loading={cancelMutation.isPending}
        onConfirm={onConfirmCancel}
      />
    </div>
  );
}
