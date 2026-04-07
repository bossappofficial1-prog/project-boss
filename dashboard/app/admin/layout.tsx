import AdminLayout from "@/components/admin/layouts/AdminLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | BOSS",
  description: "Panel kontrol utama untuk manajemen seluruh ekosistem BOSS.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}