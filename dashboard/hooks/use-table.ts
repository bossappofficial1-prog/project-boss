import { tableApi } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { gooeyToast } from "goey-toast"
import z from "zod"

export const tableSchema = z.object({
    name: z.string().min(1, 'Nama meja wajib diisi'),
    capacity: z.coerce.number().min(1, 'Kapasitas minimal 1 orang'),
    note: z.string().optional()
})

export type TableFormValues = z.infer<typeof tableSchema>

export const useTable = () => {
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: (data: { payload: TableFormValues, outletId: string }) =>
            tableApi.createTable({ ...data.payload, outletId: data.outletId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tables', data.outletId] })
            gooeyToast.success('Meja berhasil ditambahkan')
        },
        onError: (error: any) => {
            gooeyToast.error(error.response?.data?.message || 'Gagal menambahkan meja')
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: TableFormValues }) =>
            tableApi.updateTable(id, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tables', data.outletId] })
            gooeyToast.success('Meja berhasil diperbarui')
        },
        onError: (error: any) => {
            gooeyToast.error(error.response?.data?.message || 'Gagal memperbarui meja')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tableApi.deleteTable(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tables'] })
            gooeyToast.success('Meja berhasil dihapus')
        },
        onError: (error: any) => {
            gooeyToast.error(error.response?.data?.message || 'Gagal menghapus meja')
        }
    })

    return {
        createMutation,
        updateMutation,
        deleteMutation
    }
}