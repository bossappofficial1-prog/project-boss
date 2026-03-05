import DashboardLayout from '@/components/layout/DashboardLayout';

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