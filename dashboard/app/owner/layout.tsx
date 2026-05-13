import DashboardLayout from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';
import OutletTypeChecker from '@/components/layout/OutletTypeChecker';

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
            <OutletTypeChecker />
            {children}
        </DashboardLayout>
    );
}