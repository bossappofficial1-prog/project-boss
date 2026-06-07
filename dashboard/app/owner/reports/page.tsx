import ReportFinancialContent from "@/features/owner/report/outlet/report-financial-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
};

export default function ReportFinancialPage() {
  return <ReportFinancialContent />;
}
