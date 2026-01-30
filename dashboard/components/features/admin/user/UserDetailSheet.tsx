`use client`

import React, { useState } from "react";
import {
    Phone,
    Mail,
    BadgeCheck,
    Building2,
    CreditCard,
    Settings2,
    Info,
    CheckCircle2,
    Copy,
    Calendar,
} from "lucide-react";

import ReusableSheet from "@/components/ui/reuseable-sheet";
import { UserDetail, useUserDetail } from "@/hooks/useUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    userId: string;
}

const UserDetailSheet: React.FC<Props> = ({ isOpen, onClose, userId }) => {
    const { data: userDetail, isLoading } = useUserDetail(userId)

    return (
        <ReusableSheet
            isOpen={isOpen}
            onOpenChange={onClose}
            title="Detail Bisnis"
            size="md"
            cancelText="Tutup"
            description='Informasi profil dan langganan.'
            children={isLoading
                ? <p>Loading</p>
                : <UserDetailContent data={userDetail!} />}
        />
    );
};

function UserDetailContent({
    data,
}: {
    data: UserDetail,
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={data.avatar ?? '/defaults/default-avatar.jpg'}
                            className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover"
                            alt="Avatar"
                        />
                        {data.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                <BadgeCheck className="text-blue-500 w-5 h-5 fill-blue-50 dark:fill-blue-900/20" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-50 leading-tight">{data.name ?? `Nama`}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{data.email ?? `User`}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                {data.role ?? 'role'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Verified Account</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs
                defaultValue={'business'}
                className="py-6">
                <TabsList className="w-full">
                    <TabsTrigger value="business"><Building2 size={14} /> Bisnis</TabsTrigger>
                    <TabsTrigger value="bank">
                        <CreditCard size={14} />
                        Bank</TabsTrigger>
                    <TabsTrigger value="plan">
                        <Settings2 size={14} />
                        Plan</TabsTrigger>
                </TabsList>

                <TabsContent value="business">
                    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-300">
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Info size={14} />
                                Informasi Utama
                            </h4>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Nama Bisnis</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{data.business.name}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Deskripsi</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {data.business.description ?? `~`}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Kontak Owner</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-1">
                                    <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                                        <Phone size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{data.phone ?? `~`}</span>
                                </div>
                                <div className="flex items-center gap-3 p-1">
                                    <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                                        <Mail size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{data.email}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </TabsContent>
                <TabsContent value="bank">
                    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-300">
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard size={14} />
                                Metode Pencairan
                            </h4>
                            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-slate-800">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-white/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold text-indigo-300 dark:text-slate-400 uppercase tracking-widest mb-1">Bank Account</p>
                                    <p className="text-lg font-bold mb-4">{data.business.bankName}</p>

                                    <div className="flex items-center justify-between group">
                                        <p className="text-2xl font-mono tracking-wider">
                                            {data.business.bankAccount.replace(/\d(?=\d{4})/g, "•")}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(data.business.bankAccount)}
                                            className="bg-white/10 dark:bg-white/5 p-2 rounded-md hover:bg-white/20 transition-all border border-white/10"
                                        >
                                            {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/10">
                                        <p className="text-[10px] font-bold text-indigo-300 dark:text-slate-400 uppercase mb-1">Account Holder</p>
                                        <p className="font-semibold text-slate-100">{data.business.accountHolder}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </TabsContent>
                <TabsContent value="plan">
                    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-300">
                        <section>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Status Layanan</h4>
                            <div className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                                            {data.business.subscriptionPlan}
                                        </div>
                                        <h5 className="font-bold text-slate-800 dark:text-slate-100">Paket Tahunan</h5>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        {data.business.subscriptionStatus}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-3 border-t border-slate-50 dark:border-slate-800">
                                    <Calendar size={14} />
                                    Berakhir pada {new Date(data.business.subscriptionEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>

                                <button className="w-full mt-4 bg-slate-900 dark:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-sm">
                                    Upgrade Paket
                                </button>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">History Terakhir</h4>
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                                <CreditCard size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Invoice #INV-2023-00{i}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">12 Nov 2023</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rp 150.000</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    )
}

export default UserDetailSheet;
