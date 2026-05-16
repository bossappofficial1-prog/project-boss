"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Plus } from "lucide-react";

interface EmptyOutletStateProps {
    onAddOutlet?: () => void;
    title?: string;
    description?: string;
}

export const EmptyOutletState = ({
    onAddOutlet,
    title = "Belum Ada Outlet",
    description = "Anda belum menambahkan outlet untuk bisnis Anda. Buat outlet pertama Anda sekarang untuk mulai mengelola produk, layanan, dan menerima pesanan.",
}: EmptyOutletStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
            <Card className="w-full text-center border-dashed border-2 bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="pt-10 pb-10 px-6 sm:px-10 flex flex-col items-center">
                    {/* Ikon Ilustrasi */}
                    <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                        <Store className="w-12 h-12 text-primary" strokeWidth={1.5} />
                    </div>

                    {/* Teks Konten */}
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-bold text-foreground mb-3">
                            {title}
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Tombol Aksi */}
                    <Button
                        onClick={onAddOutlet}
                        size="lg"
                        className="w-full sm:w-auto font-semibold"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Tambah Outlet Pertama
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};