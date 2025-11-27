import AdminLayout from "@/components/admin/layouts/AdminLayout";

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayout>{children}</AdminLayout>;
}