"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import ReportFinancialContent from "@/components/features/owner/report/outlet/ReportFinancialContent";

export default function ManagerReportsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="FINANCE_REPORTS">
      <ReportFinancialContent />
    </PrivilegeGuard>
  );
}
