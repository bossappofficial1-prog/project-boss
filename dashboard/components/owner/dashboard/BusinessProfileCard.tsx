"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Business } from '@/types/dashboard';

interface BusinessProfileCardProps {
  business: Business | null;
  onEditBusiness: () => void;
  onEditBank: () => void;
}

export default function BusinessProfileCard({ business, onEditBusiness, onEditBank }: BusinessProfileCardProps) {
  if (!business) return null;

  return (
    <Card className="card-hover animate-fade-in-up rounded-lgshadow-lg dark:shadow-gray-900/20">
      <CardHeader className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
            <svg className="mr-2 h-6 w-6 text-red-500 sm:mr-3 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Profil Bisnis
          </CardTitle>
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
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 gap-3 sm:gap-6 xl:grid-cols-2">
          {/* Business Info */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Bisnis</label>
              <p className="break-words text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">{business.name}</p>
            </div>

            {business.description && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</label>
                <p className="break-words text-gray-700 dark:text-gray-300">{business.description}</p>
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
                <p className="break-words text-gray-700 dark:text-gray-300">{business.address}</p>
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
          <div className="space-y-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-3 sm:space-y-4 sm:p-4">
            <h3 className="flex items-center text-base font-semibold text-green-700 sm:text-lg">
              <svg className="mr-2 h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Informasi Bank
            </h3>

            {business.bankName && business.bankAccount ? (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div>
                    <label className="text-sm font-medium text-green-600">Nama Bank</label>
                    <p className="break-words font-semibold text-green-800">{business.bankName}</p>
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium text-green-600">Nomor Rekening</label>
                    <p className="break-all font-mono text-base text-green-800 sm:text-lg">{business.bankAccount}</p>
                  </div>

                  {business.accountHolder && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-green-600">Nama Pemilik Rekening</label>
                      <p className="break-words text-green-800">{business.accountHolder}</p>
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
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <svg className="mx-auto mb-2 h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium text-green-600">Informasi bank belum diatur</p>
                <p className="mt-1 text-sm text-green-500">Atur rekening bank untuk menerima pembayaran</p>
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
      </CardContent>
    </Card>
  );
}
