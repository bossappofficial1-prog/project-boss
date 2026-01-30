import ReportOutlerContent from "@/components/features/owner/report/outlet/ReportOutletContent";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: 'Laporan Outlet'
}

export default function ReportOutletPage() {
	return (<ReportOutlerContent />)
}