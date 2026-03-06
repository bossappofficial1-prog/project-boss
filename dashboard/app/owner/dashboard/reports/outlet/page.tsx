import ReportFinancialContent from "@/components/features/owner/report/outlet/ReportFinancialContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
};

export default function ReportFinancialPage() {
  return <ReportFinancialContent />;
}
