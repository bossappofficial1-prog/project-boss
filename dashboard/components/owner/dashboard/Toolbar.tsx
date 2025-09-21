"use client";

import React from 'react';

interface ToolbarProps {
  selectedDate: string;
  onDateChange: (value: string) => void;
  isConnected: boolean;
}

export function Toolbar({ selectedDate, onDateChange, isConnected }: ToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
      <div className="animate-slide-in-left" />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-slide-in-top">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 px-3 sm:px-4 py-2.5 sm:py-3 border border-red-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 input-focus">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border-none focus:outline-none text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent w-full"
          />
        </div>

        <div className={`flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-300 ${isConnected
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          <div className={`w-2 h-2 rounded-full mr-2 sm:mr-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          <span className="text-sm font-medium">
            {isConnected ? 'Terhubung' : 'Terputus'}
          </span>
        </div>
      </div>
    </div>
  );
}
