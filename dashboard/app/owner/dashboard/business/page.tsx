import type { Metadata } from "next";
import BusinessDashboardContent from "@/components/business/BusinessDashboardContent";

export const metadata: Metadata = {
    title: "Dashboard Bisnis",
    description: "Ringkasan kinerja lintas outlet, pesanan, dan pendapatan bisnis Anda.",
};

export default function BusinessDashboardPage() {
    return <BusinessDashboardContent />;
}
