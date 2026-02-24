import ReportStaffContent from "@/components/features/owner/report/staff/ReportStaffContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Staff",
};

export default function ReportStaffPage() {
  return <ReportStaffContent />;
}
