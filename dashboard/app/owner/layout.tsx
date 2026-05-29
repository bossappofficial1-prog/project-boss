import DashboardLayout from "@/components/owner/layout/DashboardLayout";
import { Metadata } from "next";
import OutletTypeChecker from "@/components/owner/layout/OutletTypeChecker";
import { FeatureGuideProvider } from "@/components/guides/FeatureGuideProvider";

export const metadata: Metadata = {
  manifest: "/owner/manifest.webmanifest",
  title: "Owner Dashboard | BOSS",
  description:
    "Pantau performa bisnis, outlet, dan transaksi Anda secara real-time.",
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
    <FeatureGuideProvider>
      <DashboardLayout requiredRole="OWNER">
        <OutletTypeChecker>{children}</OutletTypeChecker>
      </DashboardLayout>
    </FeatureGuideProvider>
  );
}
