import { outletManagementApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useAutlet = () => {
    const qc = useQueryClient();

    const updateStatusOutlet = useMutation({
        mutationFn: async (data: { outletId: string, status: boolean }) => {
            const status = data.status;
            const outletId = data.outletId;

            await outletManagementApi.update(outletId, { isOpen: status })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['outlets'] })
        }
    })

    return {
        updateStatusOutletMutate: updateStatusOutlet.mutateAsync,
        updateStatusOutletLoading: updateStatusOutlet.isPending
    }
}