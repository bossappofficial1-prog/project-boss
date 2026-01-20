import React from "react";
import {
    User,
    Wallet,
    Store,
    Phone,
    Mail,
    Landmark,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserDetail } from "@/types/userv2";

interface Props {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    data: UserDetail | null;
}

const InfoRow = ({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: React.ReactNode;
}) => (
    <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-muted-foreground mt-1" />
        <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">
                {value || "-"}
            </p>
        </div>
    </div>
);

const StatCard = ({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-border bg-background p-5 flex gap-4">
        <div className="p-3 h-fit rounded-xl bg-muted">
            <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
            </p>
            <p className="text-xl font-bold text-foreground leading-tight">
                {value}
            </p>
            {hint && (
                <p className="text-xs text-muted-foreground mt-1">
                    {hint}
                </p>
            )}
        </div>
    </div>
);

const UserDetailModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
    if (!data) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 max-h-[99dvh]">

                {/* ===== HEADER ===== */}
                <div className="border-b border-border p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                            <Store className="h-7 w-7 text-foreground" />
                        </div>

                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-foreground">
                                {data.business.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Owner: {data.user.name}
                            </p>
                        </div>

                        <Badge variant="secondary" className="ml-auto text-[10px] tracking-widest">
                            {data.user.role}
                        </Badge>
                    </div>
                </div>

                {/* ===== CONTENT ===== */}
                <div className="p-6 space-y-8 max-h-[80dvh] overflow-auto">

                    {/* ===== STATS ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                        <StatCard
                            icon={Wallet}
                            label="Saldo Wallet"
                            value={`Rp ${data.wallet.balance.toLocaleString("id-ID")}`}
                            hint={
                                <>
                                    Pending:{" "}
                                    <span className="font-semibold">
                                        Rp {data.wallet.pendingWithdrawal.toLocaleString("id-ID")}
                                    </span>
                                </>
                            }
                        />

                        <StatCard
                            icon={Store}
                            label="Outlet Aktif"
                            value={data.business.config.totalOutlets}
                        />
                    </div>

                    <Separator />

                    {/* ===== DETAIL ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* OWNER */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Informasi Owner
                            </h4>

                            <div className="space-y-4">
                                <InfoRow icon={User} label="Nama Lengkap" value={data.user.name} />
                                <InfoRow icon={Mail} label="Email" value={data.user.email} />
                                <InfoRow icon={Phone} label="WhatsApp" value={data.user.phone} />
                            </div>
                        </div>

                        {/* BUSINESS */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Informasi Bisnis
                            </h4>

                            <div className="space-y-4">
                                <InfoRow icon={Store} label="Nama Bisnis" value={data.business.name} />
                                <InfoRow
                                    icon={Store}
                                    label="Deskripsi"
                                    value={
                                        <span className="italic text-muted-foreground">
                                            “{data.business.description}”
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* ===== BANK INFO (TANPA BG GELAP) ===== */}
                    <div className="rounded-2xl border border-border bg-muted/30 p-6 flex flex-col md:flex-row gap-6 justify-between">

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-muted rounded-xl">
                                <Landmark className="h-6 w-6 text-foreground" />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Informasi Rekening
                                </p>
                                <p className="font-bold text-lg text-foreground">
                                    {data.business.bankInfo.bankName}
                                </p>
                                <p className="font-mono tracking-wider text-muted-foreground">
                                    {data.business.bankInfo.bankAccount}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    A/N:{" "}
                                    <span className="text-foreground font-medium">
                                        {data.business.bankInfo.accountHolder}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Biaya Platform
                            </span>
                            <Badge variant="outline" className="mt-2 w-fit">
                                Ditanggung {data.business.config.feeBearer}
                            </Badge>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserDetailModal;
