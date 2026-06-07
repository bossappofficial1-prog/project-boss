"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import ReportFinancialContent from "@/features/owner/report/outlet/report-financial-content";

export default function ManagerReportsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="FINANCE_REPORTS">
      <ReportFinancialContent />
    </PrivilegeGuard>
  );
}
