"use client";

import React from 'react';

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 animate-pulse border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
