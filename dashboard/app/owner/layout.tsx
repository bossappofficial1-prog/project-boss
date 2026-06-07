import DashboardLayout from "@/features/owner/layout/dashboard-layout";
import { Metadata } from "next";
import OutletTypeChecker from "@/features/owner/layout/outlet-type-checker";
import { FeatureGuideProvider } from "@/features/guides/components/feature-guide-provider";
import { OutletSync } from "@/components/providers/outlet-sync";

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
        <OutletSync>
          <OutletTypeChecker>{children}</OutletTypeChecker>
        </OutletSync>
      </DashboardLayout>
    </FeatureGuideProvider>
  );
}
