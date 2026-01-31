'use client'

import { DataTable } from "@/components/ui/data-table"
import { OutletReport } from "@/hooks/useReport"
import { formatCurrency } from "@/lib/utils";
import { Sparkline } from "../Sparkline";
import { Activity } from "lucide-react";

export interface Totals {
    jumlahTransaksi: number;
    totalPendapatan: number;
    totalPembelian: number;
    totalPengeluaran: number;
    gajiStaf: number;
    labaBersih: number;
}

type ReportOutleTableProps = {
    data: OutletReport[];
    totals: Totals
}

export function ReportOutleTable({
    data,
    totals
}: ReportOutleTableProps) {

    return (
        <DataTable
            data={data}
            globalFilter={false}
            showColumnVisibility={false}
            showTableInfo={false}
            pagination={false}
            showFooter
            columns={[
                {
                    accessorKey: 'label',
                    header: 'Tanggal',
                    footer: () => 'Tanggal'
                },
                {
                    accessorKey: 'jumlahTransaksi',
                    header: 'Trx',
                    footer: () => totals.jumlahTransaksi
                },
                {
                    accessorKey: 'totalPendapatan',
                    header: 'Penjualan',
                    cell({ row }) {
                        const totalPendapatan = row.original.totalPendapatan
                        return formatCurrency(totalPendapatan)
                    },
                    footer: () => formatCurrency(totals.totalPendapatan)
                },
                {
                    accessorKey: 'trend',
                    header: 'Tren',
                    cell({ row: rows }) {
                        const row = rows.original
                        return (
                            <div className="inline-flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800">
                                <Sparkline data={row.trend} color={row.labaBersih > 0 ? "#10b981" : "#f43f5e"} />
                            </div>
                        )
                    },
                    footer: () => <Activity className="w-5 h-5 mx-auto text-emerald-500 opacity-50" />
                },
                {
                    accessorKey: 'totalPembelian',
                    header: 'Stok',
                    cell: (props) => <span className='text-amber-600 dark:text-amber-400/80'>{formatCurrency(props.row.original.totalPembelian)}</span>,
                    footer: () => <span className='text-amber-600 dark:text-amber-400/80'>{formatCurrency(totals.totalPembelian)}</span>
                },
                {
                    accessorKey: 'totalPengeluaran',
                    header: 'Biaya',
                    cell: (props) => <span className='text-red-600 dark:text-red-400/80'>{formatCurrency(props.row.original.totalPengeluaran)}</span>,
                    footer: () => <span className='text-red-600 dark:text-red-400/80'>{formatCurrency(totals.totalPengeluaran)}</span>
                },
                {
                    accessorKey: 'gajiStaf',
                    header: 'Gaji',
                    cell: (props) => <span className='text-blue-600 dark:text-blue-400/80'>{formatCurrency(props.row.original.gajiStaf)}</span>,
                    footer: () => <span className='text-blue-600 dark:text-blue-400/80'>{formatCurrency(totals.gajiStaf)}</span>
                },
                {
                    accessorKey: 'labaBersih',
                    header: 'Laba Bersih',
                    cell: (props) => <span className='text-green-600 dark:text-green-400/80'>{formatCurrency(props.row.original.labaBersih)}</span>,
                    footer: () => <span className='text-green-600 dark:text-green-400/80'>{formatCurrency(totals.labaBersih)}</span>
                },
            ]}
        />
    )
}