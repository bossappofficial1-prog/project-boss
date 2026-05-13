import { useQuery } from "@tanstack/react-query";
import { tableApi } from "@/lib/api";

export const useGetTables = (outletId: string, enabled = true) => {
    return useQuery({
        queryKey: ["tables", outletId],
        queryFn: () => tableApi.getTables(outletId),
        enabled: !!outletId && enabled,
    });
};
