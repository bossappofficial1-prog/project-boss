import type { Metadata } from "next";
import { ProfileContent } from "@/features/owner/profile/profile-content";

export const metadata: Metadata = {
  title: "Profil Saya | BOSS Dashboard",
  description: "Halaman pengaturan profil pengguna",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
