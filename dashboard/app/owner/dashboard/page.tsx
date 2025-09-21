"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddOutletModal from '@/components/modals/AddOutletModal';
import DeleteOutletModal from '@/components/modals/DeleteOutletModal';
import BusinessProfileModal from '@/components/modals/BusinessProfileModal';
import BankAccountModal from '@/components/modals/BankAccountModal';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useDashboardData';
import StatsCards from '@/components/owner/dashboard/StatsCards';
import BusinessProfileCard from '@/components/owner/dashboard/BusinessProfileCard';
import OutletsSection from '@/components/owner/dashboard/OutletsSection';
import { Toolbar } from '@/components/owner/dashboard/Toolbar';
import { PageSkeleton } from '@/components/owner/dashboard/Skeletons';

export default function DashboardPage() {
  const {
    stats,
    business,
    outlets,
    selectedOutlet,
    selectedDate,
    isConnected,
    isLoading,
    globalError,
    setSelectedDate,
  } = useDashboardData();

  const [showOutletModal, setShowOutletModal] = useState(false);
  const [outletModalMode, setOutletModalMode] = useState<'add' | 'edit'>('add');
  const [showDeleteOutletModal, setShowDeleteOutletModal] = useState(false);
  const [selectedOutletForEdit, setSelectedOutletForEdit] = useState<any>(null);
  const [selectedOutletForDelete, setSelectedOutletForDelete] = useState<any>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [pendingCreateBusiness, setPendingCreateBusiness] = useState<{ name: string; description?: string; defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER' } | null>(null);

  const handleAddOutletSuccess = () => window.location.reload();
  const handleEditOutletSuccess = () => window.location.reload();
  const handleDeleteOutletSuccess = () => window.location.reload();
  const handleBankAccountSuccess = () => window.location.reload();

  const handleEditOutlet = (outlet: any) => {
    setSelectedOutletForEdit(outlet);
    setOutletModalMode('edit');
    setShowOutletModal(true);
  };

  const handleAddOutlet = () => {
    setSelectedOutletForEdit(null);
    setOutletModalMode('add');
    setShowOutletModal(true);
  };

  const handleDeleteOutlet = (outlet: any) => {
    setSelectedOutletForDelete(outlet);
    setShowDeleteOutletModal(true);
  };

  if (isLoading) return (<DashboardLayout><PageSkeleton /></DashboardLayout>);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
        {globalError && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {globalError}
          </div>
        )}
        <Toolbar selectedDate={selectedDate} onDateChange={setSelectedDate} isConnected={isConnected} />

        {/* Business Profile Section */}
        {business ? (
          <BusinessProfileCard
            business={business}
            onEditBusiness={() => setShowBusinessModal(true)}
            onEditBank={() => setShowBankModal(true)}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-red-50 dark:border-gray-700 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Profil Bisnis</h2>
                <p className="text-gray-600 dark:text-gray-400">Belum ada data profil bisnis. Lengkapi terlebih dahulu agar dapat menggunakan fitur secara penuh.</p>
                <div className="mt-4">
                  <Button onClick={() => setShowBusinessModal(true)}>Lengkapi Profil Bisnis</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Cards */}
        <StatsCards stats={stats} />

        {/* Outlets Section */}
        {outlets.length > 0 ? (
          <OutletsSection
            outlets={outlets}
            selectedOutlet={selectedOutlet}
            onAddOutlet={handleAddOutlet}
            onEditOutlet={handleEditOutlet}
            onDeleteOutlet={handleDeleteOutlet}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-red-50 dark:border-gray-700 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Informasi Outlet</h2>
                <p className="text-gray-600 dark:text-gray-400">Belum ada outlet terdaftar. Tambahkan outlet untuk mulai berjualan.</p>
                <div className="mt-4">
                  <Button onClick={handleAddOutlet}>Tambah Outlet</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank owner info empty card if business exists but no bank */}
        {business && !(business.bankName && business.bankAccount) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-green-100 dark:border-green-800/50 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Informasi Pemilik Rekening</h2>
            <p className="text-gray-600 dark:text-gray-400">Lengkapi informasi pemilik rekening untuk penarikan dana.</p>
            <div className="mt-4">
              <Button onClick={() => setShowBankModal(true)}>Lengkapi Informasi Rekening</Button>
            </div>
          </div>
        )}
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
            window.location.reload()
          }
        }}
        onCreateRequested={(data) => {
          setPendingCreateBusiness(data)
          setShowBusinessModal(false)
          setShowBankModal(true)
        }}
      />
      {/* Bank modal: update if business exists, or create if not */}
      <BankAccountModal
        open={showBankModal}
        onOpenChange={(v) => {
          setShowBankModal(v)
          if (!v) setPendingCreateBusiness(null)
        }}
        businessId={business?.id}
        createPayload={business ? undefined : pendingCreateBusiness ?? undefined}
        onSuccess={() => {
          setPendingCreateBusiness(null)
          handleBankAccountSuccess()
        }}
      />

      {/* Outlet Modal (Add/Edit) */}
      <AddOutletModal
        open={showOutletModal}
        onOpenChange={setShowOutletModal}
        mode={outletModalMode}
        businessId={business?.id || ''}
        outlet={outletModalMode === 'edit' ? selectedOutletForEdit : undefined}
        onSuccess={outletModalMode === 'edit' ? handleEditOutletSuccess : handleAddOutletSuccess}
      />

      {/* Delete Outlet Modal */}
      <DeleteOutletModal
        open={showDeleteOutletModal}
        onOpenChange={setShowDeleteOutletModal}
        outlet={selectedOutletForDelete}
        onSuccess={handleDeleteOutletSuccess}
      />
    </DashboardLayout>
  );
}                                                                                                                                             