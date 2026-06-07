import type { Metadata } from "next";
import { SettingsContent } from "@/features/owner/settings/settings-content";

export const metadata: Metadata = {
  title: "Pengaturan | BOSS Dashboard",
  description: "Halaman pengaturan akun dan preferensi dashboard",
};

export default function OwnerSettingsPage() {
  return <SettingsContent />;
}
