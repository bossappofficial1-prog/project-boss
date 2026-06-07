"use client";

import { useMemo } from "react";
import { useManagerContext } from "../layout";
import OwnerTransactionsPage from "@/app/owner/transactions/page";
import TransactionDeletesPage from "@/app/owner/transaction-deletes/page";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { History, Trash2 } from "lucide-react";
import PrivilegeGuard from "@/components/shared/privilege-guard";

export default function ManagerTransactionsPage() {
  const { managerData } = useManagerContext();
  const privileges = managerData?.privileges || [];
  
  const privilegesNormalized = useMemo(() => {
    return privileges.map((p: any) => p.privilege || p);
  }, [privileges]);
  
  const hasDeleteAccess = privilegesNormalized.includes("TRANSACTION_DELETE");

  return (
    <PrivilegeGuard requiredPrivilege="TRANSACTION_VIEW">
      {hasDeleteAccess ? (
        <div className="space-y-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid grid-cols-2 max-w-md mb-2">
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Riwayat Penjualan</span>
              </TabsTrigger>
              <TabsTrigger value="deletes" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Persetujuan Penghapusan</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-4">
              <OwnerTransactionsPage />
            </TabsContent>
            
            <TabsContent value="deletes" className="mt-4">
              <TransactionDeletesPage />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <OwnerTransactionsPage />
      )}
    </PrivilegeGuard>
  );
}
