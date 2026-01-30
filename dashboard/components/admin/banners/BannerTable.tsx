import { DataTable } from "@/components/ui/data-table";
import { Banner } from "@/hooks/useBanners";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, LinkIcon, PencilIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type BannerTableProps = {
    data: Banner[];
    isLoading: boolean;
    onEdit: (banner: Banner) => void;
    onDelete: (banner: Banner) => void;
    onReOrder?: (payload: { id: string, order: number }[]) => void;
}

export function BannerTable(
    {
        data,
        isLoading = true,
        onDelete,
        onEdit,
        onReOrder
    }: BannerTableProps
) {
    const [tableData, setTableData] = useState(data);
    useEffect(() => {
        setTableData(data);
    }, [data]);
    const columns: ColumnDef<Banner>[] = [
        {
            accessorKey: `sortOrder`,
            header: `Urutan`,
            enableSorting: false,
        },
        {
            accessorKey: `ctaPayload`,
            header: `Banner`,
            enableSorting: false,
            cell(props) {
                const banner = props.row.original;

                return (
                    <div
                        key={banner.id}
                        className={`flex items-center gap-4 cursor-pointer transition-all`}
                    >
                        <div className="h-16 w-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200 relative">
                            <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
                            {!banner.isActive && (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                                    <Eye className="h-4 w-4 text-white opacity-50" />
                                </div>
                            )}
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground truncate">{banner.title}</h4>
                                {banner.isActive ? (
                                    <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Active</span>
                                ) : (
                                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">Inactive</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground w-[300px] truncate">{banner.subtitle}</p>
                            {banner.ctaType !== 'none' && banner.ctaPayload && (
                                <div className="flex items-center mt-1 text-[10px] text-indigo-600">
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    {banner.ctaPayload}
                                </div>
                            )}
                        </div>
                    </div>
                )
            },
        },
    ]

    return (
        <DataTable
            showColumnVisibility={false}
            pageSize={5}
            isLoading={isLoading}
            columns={columns}
            onRowReorder={({ data, payload }) => {
                setTableData(data)
                onReOrder?.(payload.map(item => ({ id: String(item.id), order: item.order })))
            }}
            data={tableData}
            enableRowDrag
            rowActions={() => [
                {
                    icon: PencilIcon,
                    variant: `ghost`,
                    onClick: onEdit
                },
                {
                    icon: Trash2,
                    variant: `ghost`,
                    className: `text-red-500`,
                    onClick: onDelete
                }
            ]}
            actionViewType="flex"
        />
    )
}