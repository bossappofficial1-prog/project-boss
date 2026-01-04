'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoveLeft, Home, FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
    const router = useRouter();

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white font-sans text-slate-900 selection:bg-blue-100">

            {/* Menggunakan CSS grid pattern murni agar ringan dan mengikuti tema */}
            <div className="absolute inset-0 z-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
                {/* Radial gradient mask agar pattern memudar di pinggir */}
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]" />
            </div>

            {/* --- MAIN CONTENT CARD --- */}
            <div className="z-10 w-full max-w-3xl px-6 text-center">

                {/* Animated Icon Container */}
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50/50 shadow-inner ring-1 ring-blue-100 backdrop-blur-sm sm:h-32 sm:w-32">
                    <FileQuestion className="h-10 w-10 text-blue-600 sm:h-12 sm:w-12 animate-pulse" />
                </div>

                {/* Typography: Status Code */}
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
                    Error 404
                </p>

                {/* Typography: Main Headline */}
                <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                    Halaman tidak ditemukan
                </h1>

                {/* Typography: Description */}
                <p className="mx-auto mb-10 max-w-lg text-lg text-slate-600 leading-relaxed">
                    Maaf, kami tidak dapat menemukan halaman yang Anda cari.
                    Mungkin URL salah ketik atau halaman sudah dipindahkan.
                </p>

                {/* --- ACTION BUTTONS --- */}
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">

                    {/* Button: Back (Secondary) */}
                    <button
                        onClick={() => router.back()}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm active:scale-95 sm:w-auto"
                    >
                        <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Kembali
                    </button>

                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 sm:w-auto"
                    >
                        <Home className="h-4 w-4" />
                        Ke Beranda
                    </Link>

                </div>

                {/* Footer info */}
                <div className="mt-16 border-t border-slate-100 pt-8">
                    <p className="text-xs text-slate-400">
                        Code: <span className="font-mono text-slate-500">CLIENT_ERR_NOT_FOUND</span>
                    </p>
                </div>

            </div>
        </div>
    );
}