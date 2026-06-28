"use client";

import { useEffect, useState } from "react";
import AddOutletModal from "@/components/modals/add-outlet-modal";
import DeleteOutletModal from "@/components/modals/delete-outlet-modal";
import BusinessProfileModal from "@/components/modals/business-profile-modal";
import BankAccountModal from "@/components/modals/bank-account-modal";
import { Building2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import StatsCards from "@/features/owner/dashboard/stats-cards";
import BusinessProfileCard from "@/features/owner/dashboard/business-profile-card";
import OutletsSection from "@/features/owner/dashboard/outlets-section";
import { PageSkeleton } from "@/features/owner/dashboard/skeletons";
import { Card } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { outletManagementApi } from "@/lib/api";
import { gooeyToast } from "goey-toast";
import { PageGuide } from "@/features/guides/components/page-guide";

export default function DashboardPage() {
  const {
    stats,
    business,
    outlets,
    selectedOutlet,
    isLoading,
    globalError,
    refetch,
  } = useDashboardData();
  const queryClient = useQueryClient();
  const { mutateAsync: updateStatusOutletMutate } = useMutation({
    mutationFn: async ({
      outletId,
      status,
    }: {
      outletId: string;
      status: boolean;
    }) => {
      return outletManagementApi.update(outletId, { isOpen: status });
    },
    onMutate: async ({ outletId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["outlets"] });
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Snapshot previous value
      const previousOutlets = queryClient.getQueryData(["outlets"]);
      const previousDashboard = queryClient.getQueryData(["dashboard"]);

      // Optimistically update outlets cache
      queryClient.setQueryData(["outlets"], (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((outlet: any) =>
            outlet.id === outletId ? { ...outlet, isOpen: status } : outlet,
          );
        }
        if (old.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((outlet: any) =>
              outlet.id === outletId ? { ...outlet, isOpen: status } : outlet,
            ),
          };
        }
        return old;
      });

      // Optimistically update dashboard cache
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old?.outlets) return old;
        return {
          ...old,
          outlets: old.outlets.map((outlet: any) =>
            outlet.id === outletId ? { ...outlet, isOpen: status } : outlet,
          ),
        };
      });

      return { previousOutlets, previousDashboard };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousOutlets) {
        queryClient.setQueryData(["outlets"], context.previousOutlets);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(["dashboard"], context.previousDashboard);
      }
      gooeyToast.error("Gagal mengubah status outlet");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const [showOutletModal, setShowOutletModal] = useState(false);
  const [outletModalMode, setOutletModalMode] = useState<"add" | "edit">("add");
  const [showDeleteOutletModal, setShowDeleteOutletModal] = useState(false);
  const [selectedOutletForEdit, setSelectedOutletForEdit] = useState<any>(null);
  const [selectedOutletForDelete, setSelectedOutletForDelete] =
    useState<any>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [pendingCreateBusiness, setPendingCreateBusiness] = useState<{
    name: string;
    description?: string;
    defaultTransactionFeeBearer: "CUSTOMER" | "OWNER";
  } | null>(null);

  const handleAddOutletSuccess = () => refetch();
  const handleEditOutletSuccess = () => refetch();
  const handleDeleteOutletSuccess = () => refetch();
  const handleBankAccountSuccess = () => refetch();

  const handleEditOutlet = (outlet: any) => {
    setSelectedOutletForEdit(outlet);
    setOutletModalMode("edit");
    setShowOutletModal(true);
  };

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#add-outlet") {
        setShowOutletModal(true);
      }
    };

    handleHash();

    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleAddOutlet = () => {
    setSelectedOutletForEdit(null);
    setOutletModalMode("add");
    setShowOutletModal(true);
  };

  const handleDeleteOutlet = (outlet: any) => {
    setSelectedOutletForDelete(outlet);
    setShowDeleteOutletModal(true);
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <PageGuide
        id="owner-dashboard"
        runOnceKey="owner-guide-seen"
        steps={[
          {
            id: "welcome",
            title: "Dashboard Owner",
            description:
              "Pusat kendali bisnis Anda. Pantau metrik utama, kelola outlet, dan akses fitur bisnis dengan cepat.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "business",
            title: "Profil Bisnis",
            description:
              "Edit nama, deskripsi bisnis, dan atur rekening bank untuk pencairan dana penjualan.",
            target: "[data-guide='dashboard-business']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "stats",
            title: "Ringkasan Metrik",
            description:
              "Total produk, pendapatan hari ini, pesanan aktif — lihat kesehatan bisnis Anda sekilas.",
            target: "[data-guide='dashboard-stats']",
            placement: "top",
            offset: 8,
          },
          {
            id: "outlets",
            title: "Manajemen Outlet",
            description:
              "Daftar semua outlet: toggle buka/tutup, edit data, tambah outlet baru, atau hapus.",
            target: "[data-guide='dashboard-outlets']",
            placement: "top",
            offset: 8,
          },
        ]}
      />

      <div className="space-y-3 animate-fade-in-up">
        {globalError && (
          <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-500/5 p-4 text-red-700 shadow-sm animate-shake">
            <div className="p-1.5 rounded-full bg-red-500/10">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-tight">
              {globalError}
            </p>
          </div>
        )}

        {/* Business Profile Section */}
        {business ? (
          <div data-guide="dashboard-business">
            <BusinessProfileCard
              business={business}
              onEditBusiness={() => setShowBusinessModal(true)}
              onEditBank={() => setShowBankModal(true)}
            />
          </div>
        ) : (
          <Card className="rounded-md overflow-hidden border-2 border-dashed border-red-200 bg-red-500/5 p-6 sm:p-8 animate-fade-in group hover:bg-red-500/10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="p-4 rounded-full bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform shadow-sm border border-red-500/20">
                <Building2 className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  Konfigurasi Profil Bisnis Diperlukan
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  Data profil bisnis Anda belum lengkap. Identitas bisnis yang
                  jelas sangat krusial untuk laporan pajak, penagihan, dan
                  kepercayaan pelanggan pada outlet Anda.
                </p>
                <div className="pt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                  <Button onClick={() => setShowBusinessModal(true)} size="lg">
                    Lengkapi Profil Bisnis Sekarang
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Stats Cards */}
        <div data-guide="dashboard-stats">
          <StatsCards stats={stats} />
        </div>

        {/* Outlets Section */}
        <div data-guide="dashboard-outlets">
          <OutletsSection
            onToggleOutletActive={async (outlet) => {
              await updateStatusOutletMutate({
                outletId: outlet.id,
                status: !outlet.isOpen,
              });
            }}
            outlets={outlets}
            selectedOutlet={selectedOutlet?.id}
            onAddOutlet={handleAddOutlet}
            onEditOutlet={handleEditOutlet}
            onDeleteOutlet={handleDeleteOutlet}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Modals */}
      <BusinessProfileModal
        open={showBusinessModal}
        onOpenChange={setShowBusinessModal}
        businessId={business?.id}
        initialName={business?.name}
        initialDescription={business?.description}
        onSuccess={() => {
          // if updating, just reload; if creating, handled in onCreateRequested
          if (business?.id) {
            refetch();
          }
        }}
        onCreateRequested={(data) => {
          setPendingCreateBusiness(data);
          setShowBusinessModal(false);
          setShowBankModal(true);
        }}
      />
      {/* Bank modal: update if business exists, or create if not */}
      <BankAccountModal
        open={showBankModal}
        onOpenChange={(v) => {
          setShowBankModal(v);
          if (!v) setPendingCreateBusiness(null);
        }}
        businessId={business?.id}
        createPayload={
          business ? undefined : (pendingCreateBusiness ?? undefined)
        }
        onSuccess={() => {
          setPendingCreateBusiness(null);
          handleBankAccountSuccess();
        }}
      />

      {/* Outlet Modal (Add/Edit) */}
      <AddOutletModal
        open={showOutletModal}
        onOpenChange={setShowOutletModal}
        mode={outletModalMode}
        businessId={business?.id || ""}
        outlet={outletModalMode === "edit" ? selectedOutletForEdit : undefined}
        onSuccess={
          outletModalMode === "edit"
            ? handleEditOutletSuccess
            : handleAddOutletSuccess
        }
      />

      {/* Delete Outlet Modal */}
      <DeleteOutletModal
        open={showDeleteOutletModal}
        onOpenChange={setShowDeleteOutletModal}
        outlet={selectedOutletForDelete}
        onSuccess={handleDeleteOutletSuccess}
      />
    </>
  );
}
