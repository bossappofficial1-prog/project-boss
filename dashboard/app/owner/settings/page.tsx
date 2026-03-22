import type { Metadata } from "next";
import { SettingsContent } from "@/components/owner/settings/SettingsContent";

export const metadata: Metadata = {
  title: "Pengaturan | BOSS Dashboard",
  description: "Halaman pengaturan akun dan preferensi dashboard",
};

export default function OwnerSettingsPage() {
  return <SettingsContent />;
}
