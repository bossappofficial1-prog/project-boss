'use client';

import React from 'react';

export default function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      {/* Left Side: Professional/Brand Area */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0B1120] overflow-hidden flex-col justify-between p-16 text-white text-sans">
        {/* Abstract 3D Geometric Shapes Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/10 blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/20 to-blue-500/10 blur-[60px]" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px]" />

          {/* Geometric Accents */}
          <div className="absolute top-20 right-20 w-24 h-24 border border-white/10 rounded-2xl transform rotate-12 backdrop-blur-sm opacity-50" />
          <div className="absolute bottom-32 left-10 w-32 h-32 border border-white/5 rounded-full backdrop-blur-md opacity-40" />
        </div>

        {/* Spacer to maintain vertical balance with justify-between */}
        <div className="relative z-10"></div>

        {/* Main Text Content */}
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
            Kelola Bisnis Anda <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
              Lebih Profesional
            </span>
          </h1>
          <p className="text-lg text-slate-400 font-light leading-relaxed">
            Platform terintegrasi untuk memaksimalkan efisiensi operasional dan pertumbuhan bisnis Anda dalam satu dashboard yang elegan.
          </p>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 text-sm text-slate-500">
          &copy; {currentYear} BOSS Business Management. Seluruh hak cipta dilindungi.
        </div>
      </div>

      {/* Right Side Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center  p-4 md:p-8 lg:p-12 relative bg-white overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
