import DashboardLayout from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Owner Dashboard | BOSS",
    description: "Pantau performa bisnis, outlet, dan transaksi Anda secara real-time.",
    robots: {
        index: true,
        follow: true,
    },
};

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout requiredRole="OWNER">
            {children}
        </DashboardLayout>
    );
}