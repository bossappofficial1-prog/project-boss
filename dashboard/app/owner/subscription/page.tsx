'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  useOwnerSubscriptionInvoices,
  useOwnerSubscriptionOverview,
  useRenewSubscription,
} from '@/hooks/api/use-owner-subscription';
import { InvoiceHistorySection } from '@/components/features/owner/subscription/InvoiceHistorySection';
import { SubscriptionSkeleton } from '../../../components/features/owner/subscription/SubscriptionSkeleton';
import { SubscriptionDetailSection } from '@/components/features/owner/subscription/SubscriptionDetailSection';
import { OwnerSubscriptionHeader } from '@/components/features/owner/subscription/OwnerSubscriptionHeader';
import { UsageGrid } from '@/components/features/owner/subscription/UsageGrid';
import { PendingInvoiceCard } from '@/components/features/owner/subscription/PendingInvoiceCard';
import { NoPendingInvoiceCard } from '@/components/features/owner/subscription/NoPendingInvoiceCard';
import { EmptySubscriptionState } from '@/components/features/owner/subscription/EmptySubscriptionState';
import { PlanSelectorDialog } from '@/components/features/owner/subscription/PlanSelectorDialog';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlan';

const PAGE_SIZE = 6;

export default function OwnerSubscriptionPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const limit = PAGE_SIZE;

  const overviewQuery = useOwnerSubscriptionOverview();
  const invoicesQuery = useOwnerSubscriptionInvoices({ page, limit });
  const renewMutation = useRenewSubscription();
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

  const startRenew = async (planCodeOverride?: string | null) => {
    if (renewMutation.isPending) return;
    const targetPlanCode = planCodeOverride ?? plan?.code;
    if (!targetPlanCode) return;

    try {
      const result = await renewMutation.mutateAsync({ planCode: targetPlanCode });
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

    await startRenew(plan.code);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlanCode) return;
    await startRenew(selectedPlanCode);
    setPlanModalOpen(false);
  };

  const handleRefresh = () => {
    overviewQuery.refetch();
    invoicesQuery.refetch();
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
          />

          {usage && <UsageGrid usage={usage} />}

          <section>
            {pendingInvoice ? (
              <PendingInvoiceCard pendingInvoice={pendingInvoice} />
            ) : (
              <NoPendingInvoiceCard onRenew={handleRenew} disabled={renewMutation.isPending || (!plan && planOptions.length === 0)} loading={renewMutation.isPending} />
            )}
          </section>

          <InvoiceHistorySection
            query={invoicesQuery}
            page={page}
            limit={limit}
            onPageChange={setPage}
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
    </div>
  );
}
