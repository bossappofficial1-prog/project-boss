import UserContent from "@/components/features/admin/user/UserContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Keloal user yang terdaftar'
}

export default function UserPage() {
  return (<UserContent />)
}