"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import type { Business } from '@/types/dashboard';

interface BusinessProfileCardProps {
  business: Business | null;
  onEditBusiness: () => void;
  onEditBank: () => void;
}

export default function BusinessProfileCard({ business, onEditBusiness, onEditBank }: BusinessProfileCardProps) {
  if (!business) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Profil Bisnis
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onEditBusiness}
            variant="ghost"
            size="sm"
            type="button"
            className="h-auto rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Edit Profil Bisnis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Business Info */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Bisnis</label>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 break-words">{business.name}</p>
          </div>

          {business.description && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</label>
              <p className="text-gray-700 dark:text-gray-300 break-words">{business.description}</p>
            </div>
          )}

          {business.type && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Jenis Bisnis</label>
              <p className="text-gray-700 dark:text-gray-300">{business.type}</p>
            </div>
          )}

          {business.address && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Alamat</label>
              <p className="text-gray-700 dark:text-gray-300 break-words">{business.address}</p>
            </div>
          )}

          {business.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</label>
              <p className="text-gray-700 dark:text-gray-300">{business.phone}</p>
            </div>
          )}
        </div>

        {/* Bank Info */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <h3 className="text-base sm:text-lg font-semibold text-green-700 flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Informasi Bank
          </h3>

          {business.bankName && business.bankAccount ? (
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div>
                  <label className="text-sm font-medium text-green-600">Nama Bank</label>
                  <p className="text-green-800 font-semibold break-words">{business.bankName}</p>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium text-green-600">Nomor Rekening</label>
                  <p className="text-green-800 font-mono text-base sm:text-lg break-all">{business.bankAccount}</p>
                </div>

                {business.accountHolder && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-green-600">Nama Pemilik Rekening</label>
                    <p className="text-green-800 break-words">{business.accountHolder}</p>
                  </div>
                )}

                {business.transactionFeeBearer && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-green-600">Penanggung Biaya Transaksi</label>
                    <p className="text-green-800">{business.transactionFeeBearer}</p>
                  </div>
                )}
              </div>

              <Button
                onClick={onEditBank}
                variant="ghost"
                size="icon"
                type="button"
                className="h-auto w-auto flex-shrink-0 rounded-lg p-1.5 text-green-600 hover:bg-green-100 sm:p-2"
                title="Edit informasi bank"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-600 font-medium">Informasi bank belum diatur</p>
              <p className="text-green-500 text-sm mt-1">Atur rekening bank untuk menerima pembayaran</p>
              <Button
                onClick={onEditBank}
                type="button"
                className="mt-3 h-auto rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
              >
                Atur Informasi Bank
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
