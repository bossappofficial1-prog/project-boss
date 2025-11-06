"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
    RowSelectionState,
    PaginationState,
    Updater
} from "@tanstack/react-table";
import type { LucideIcon } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";

type CsvExportConfig<TData> = {
    enabled?: boolean;
    filename?: string;
    includeHeaders?: boolean;
    customMapping?: (row: TData) => Record<string, any>;
};

type PdfExportConfig<TData> = {
    enabled?: boolean;
    filename?: string;
    title?: string;
    includeStats?: boolean;
    customMapping?: (row: TData) => Record<string, any>;
};

type RowAction<TData> = {
    label?: string;
    onClick?: (row: TData) => void;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    variant?: ComponentProps<typeof Button>['variant'];
    className?: string;
    disabled?: boolean;
    keepOpenOnSelect?: boolean;
    render?: (row: TData) => ReactNode;
};
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    Filter,
    Download,
    Settings2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    X,
    FileSpreadsheet,
    FileText,
    ChevronDown,
    MoreHorizontal,
    Columns3
} from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced DataTable Props with comprehensive feature set
interface DataTableProps<TData, TValue> {
    // Core props
    columns: ColumnDef<TData, TValue>[];
    data: TData[];

    // Search & Filter
    searchKey?: string;
    searchPlaceholder?: string;
    globalFilter?: boolean;
    serverSideSearch?: boolean;
    onSearchChange?: (value: string) => void;
    searchValue?: string;
    searchDebounceMs?: number;

    // Selection
    enableRowSelection?: boolean;
    onRowSelectionChange?: (selectedRows: TData[]) => void;

    // Pagination
    pagination?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    // Server-side pagination
    serverSidePagination?: boolean; // when true, component will expect server-controlled pages
    totalItems?: number; // total items on server (used for info and pageCount)
    serverPage?: number; // current page from server (1-based)
    serverLimit?: number; // current limit/pageSize from server
    onPaginationChange?: (params: { page: number; limit: number }) => void; // called when user changes page or page size

    // Loading & States
    isLoading?: boolean;
    isRefreshing?: boolean;
    onRefresh?: () => void;

    // Export
    enableExport?: boolean;
    exportFilename?: string;
    exportTitle?: string;
    exportConfig?: {
        csv?: CsvExportConfig<TData>;
        pdf?: PdfExportConfig<TData>;
    };
    onExportStart?: (format: 'csv' | 'pdf') => void;
    onExportComplete?: (format: 'csv' | 'pdf', recordCount: number) => void;
    onExportError?: (format: 'csv' | 'pdf', error: string) => void;

    // Customization
    title?: string;
    description?: string;
    emptyMessage?: string;
    showColumnVisibility?: boolean;
    showTableInfo?: boolean;
    density?: 'compact' | 'normal' | 'comfortable';

    // Row Actions
    rowActions?: (row: TData) => Array<RowAction<TData>>;
    labelAction?: string
    actionViewType?: "dropdown" | "flex"

    // Bulk Actions
    bulkActions?: Array<{
        label: string;
        onClick: (selectedRows: TData[]) => void;
        icon?: React.ComponentType<{ className?: string }>;
        variant?: 'default' | 'destructive';
    }>;

    // Advanced Features
    enableColumnResizing?: boolean;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    stickyHeader?: boolean;
    striped?: boolean;
    bordered?: boolean;

    // Mobile
    mobileBreakpoint?: number;
    mobileCardRender?: (row: TData) => React.ReactNode;

    // Accessibility
    ariaLabel?: string;
    ariaDescription?: string;

    // Callbacks
    onRowClick?: (row: TData) => void;
    onSortingChange?: (sorting: SortingState) => void;
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    globalFilter = true,
    serverSideSearch = false,
    onSearchChange,
    searchValue,
    searchDebounceMs,
    enableRowSelection = false,
    onRowSelectionChange,
    pagination = true,
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
    serverSidePagination = false,
    totalItems,
    serverPage,
    serverLimit,
    onPaginationChange,
    isLoading = false,
    isRefreshing = false,
    onRefresh,
    enableExport = false,
    exportFilename = "table-data",
    exportTitle,
    exportConfig,
    onExportStart,
    onExportComplete,
    onExportError,
    labelAction,
    title,
    description,
    emptyMessage = "No results found.",
    showColumnVisibility = true,
    showTableInfo = true,
    density = 'normal',
    rowActions,
    bulkActions,
    enableColumnResizing = false,
    actionViewType = 'flex',
    enableSorting = true,
    stickyHeader = false,
    striped = true,
    bordered = true,
    mobileBreakpoint = 768,
    mobileCardRender,
    ariaLabel = "Data table",
    ariaDescription,
    onRowClick,
    onSortingChange,
    onColumnFiltersChange,
}: DataTableProps<TData, TValue>) {
    // State Management
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [globalFilterValue, setGlobalFilterValue] = useState(() => searchValue ?? "");
    const [paginationState, setPaginationState] = useState<PaginationState>(() => ({
        pageIndex: serverSidePagination && typeof serverPage === "number" ? Math.max(0, serverPage - 1) : 0,
        pageSize: serverSidePagination && typeof serverLimit === "number" ? serverLimit : pageSize,
    }));
    const pageSizePropRef = useRef(pageSize);
    const pendingPaginationRef = useRef<null | { pageIndex: number; pageSize: number }>(null);
    const searchDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suppressSearchEffectRef = useRef(false);
    const previousSearchValueRef = useRef(searchValue);
    const [isMobile, setIsMobile] = useState(false);

    // Table Settings State
    const [currentDensity, setCurrentDensity] = useState<'compact' | 'normal' | 'comfortable'>(density);
    const [isStriped, setIsStriped] = useState(striped);
    const [isBordered, setIsBordered] = useState(bordered);

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < mobileBreakpoint);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [mobileBreakpoint]);

    useEffect(() => {
        if (serverSidePagination) {
            pageSizePropRef.current = pageSize;
            return;
        }

        if (pageSizePropRef.current !== pageSize) {
            pageSizePropRef.current = pageSize;
            setPaginationState(prev => ({ ...prev, pageSize }));
        }
    }, [pageSize, serverSidePagination]);

    useEffect(() => {
        if (!serverSidePagination) {
            return;
        }

        if (typeof serverPage === 'number') {
            const normalized = Math.max(0, serverPage - 1);
            setPaginationState(prev =>
                prev.pageIndex === normalized ? prev : { ...prev, pageIndex: normalized }
            );
        }
    }, [serverSidePagination, serverPage]);

    useEffect(() => {
        if (!serverSidePagination) {
            return;
        }

        if (typeof serverLimit === 'number') {
            setPaginationState(prev =>
                prev.pageSize === serverLimit ? prev : { ...prev, pageSize: serverLimit }
            );
        }
    }, [serverSidePagination, serverLimit]);

    useEffect(() => {
        if (!serverSideSearch) {
            return;
        }

        if (typeof searchValue !== 'string') {
            return;
        }

        if (previousSearchValueRef.current === searchValue) {
            return;
        }

        previousSearchValueRef.current = searchValue;
        suppressSearchEffectRef.current = true;
        setGlobalFilterValue(searchValue);
    }, [serverSideSearch, searchValue, globalFilterValue]);

    useEffect(() => {
        if (!serverSideSearch || !onSearchChange) {
            return;
        }

        if (suppressSearchEffectRef.current) {
            suppressSearchEffectRef.current = false;
            return;
        }

        if (searchDebounceTimeoutRef.current) {
            clearTimeout(searchDebounceTimeoutRef.current);
        }

        const delay = typeof searchDebounceMs === 'number' ? Math.max(searchDebounceMs, 0) : 300;
        searchDebounceTimeoutRef.current = setTimeout(() => {
            onSearchChange(globalFilterValue);
            searchDebounceTimeoutRef.current = null;
        }, delay);

        return () => {
            if (searchDebounceTimeoutRef.current) {
                clearTimeout(searchDebounceTimeoutRef.current);
                searchDebounceTimeoutRef.current = null;
            }
        };
    }, [serverSideSearch, onSearchChange, globalFilterValue, searchDebounceMs]);

    // Enhanced columns with selection and validation
    const enhancedColumns = useMemo(() => {
        const cols = [...columns];

        // Add selection column if enabled (only if not already present)
        if (enableRowSelection) {
            const hasSelectColumn = cols.some(col =>
                (col as any).id === "select" ||
                (col as any).accessorKey === "select"
            );
            if (!hasSelectColumn) {
                cols.unshift({
                    id: "select",
                    header: ({ table }) => (
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                            className="translate-y-[2px]"
                        />
                    ),
                    cell: ({ row }) => (
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                            className="translate-y-[2px]"
                        />
                    ),
                    enableSorting: false,
                    enableHiding: false,
                    size: 40,
                } as ColumnDef<TData, TValue>);
            }
        }

        // Add row actions column if provided (only if not already present)
        if (rowActions) {
            const hasActionsColumn = cols.some(col =>
                (col as any).id === "actions" ||
                (col as any).accessorKey === "actions"
            );
            if (!hasActionsColumn) {
                cols.push({
                    id: "actions",
                    header: labelAction || "Actions",
                    cell: ({ row }) => {
                        const actions = rowActions(row.original);
                        if (actionViewType === 'dropdown') {
                            return <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        aria-label="Open menu"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {actions.map((action, index) => {
                                        const Icon = action.icon;
                                        const shouldKeepOpen = action.keepOpenOnSelect ?? Boolean(action.render);

                                        return (
                                            <DropdownMenuItem
                                                key={index}
                                                disabled={action.disabled}
                                                onSelect={(event) => {
                                                    if (shouldKeepOpen) {
                                                        event.preventDefault();
                                                    }

                                                    if (!action.render) {
                                                        action.onClick?.(row.original);
                                                    }
                                                }}
                                                className={cn(
                                                    action.render ? "cursor-default" : "cursor-pointer",
                                                    action.variant === 'destructive' && "text-red-600 focus:text-red-600",
                                                    action.className
                                                )}
                                            >
                                                {action.render ? (
                                                    action.render(row.original)
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {Icon && <Icon className={cn("h-4 w-4", action.variant === 'destructive' && "text-red-600 focus:text-red-600")} />}
                                                        <span>{action.label}</span>
                                                    </div>
                                                )}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        }
                        if (actionViewType === 'flex') {
                            return (
                                <div className="flex flex-wrap gap-2">
                                    {actions.map((action, index) => {
                                        const Icon = action.icon;
                                        if (action.render) {
                                            return (
                                                <div key={index} className={cn("flex items-center", action.className)}>
                                                    {action.render(row.original)}
                                                </div>
                                            );
                                        }

                                        return (
                                            <Button
                                                key={index}
                                                variant={action.variant ?? 'outline'}
                                                size="sm"
                                                className={cn("gap-1", action.className)}
                                                onClick={() => action.onClick?.(row.original)}
                                                disabled={action.disabled}
                                            >
                                                {Icon && <Icon className="h-4 w-4" />}
                                                {action.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            );
                        }

                        return null;
                    },
                    enableSorting: false,
                    enableHiding: false,
                    size: 60,
                } as ColumnDef<TData, TValue>);
            }
        }

        // Validate for duplicate column IDs/keys (development warning)
        if (process.env.NODE_ENV === 'development') {
            const columnIds = cols.map(col => (col as any).id || (col as any).accessorKey).filter(Boolean);
            const duplicates = columnIds.filter((id, index) => columnIds.indexOf(id) !== index);
            if (duplicates.length > 0) {
                console.warn('DataTable: Duplicate column IDs detected:', duplicates);
            }
        }

        return cols;
    }, [columns, enableRowSelection, rowActions, actionViewType, labelAction]);

    const handleTablePaginationChange = useCallback((updater: Updater<PaginationState>) => {
        setPaginationState(prev => {
            const baseState = prev;
            const nextState = typeof updater === 'function' ? updater(baseState) : updater;
            const nextPageIndex = nextState.pageIndex ?? baseState.pageIndex;
            const nextPageSize = nextState.pageSize ?? baseState.pageSize;
            const pageSizeChanged = nextPageSize !== baseState.pageSize;
            const normalizedPageIndex = pageSizeChanged ? 0 : nextPageIndex;
            pendingPaginationRef.current = {
                pageIndex: normalizedPageIndex,
                pageSize: nextPageSize,
            };

            return {
                pageIndex: normalizedPageIndex,
                pageSize: nextPageSize,
            };
        });
    }, []);

    useEffect(() => {
        if (!serverSidePagination) {
            pendingPaginationRef.current = null;
            return;
        }

        const pending = pendingPaginationRef.current;
        if (!pending) {
            return;
        }

        if (pending.pageIndex === paginationState.pageIndex && pending.pageSize === paginationState.pageSize) {
            pendingPaginationRef.current = null;
            onPaginationChange?.({ page: pending.pageIndex + 1, limit: pending.pageSize });
        }
    }, [paginationState, serverSidePagination, onPaginationChange]);

    // Table instance with enhanced features
    const table = useReactTable({
        data,
        columns: enhancedColumns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter: serverSideSearch ? "" : globalFilterValue,
            pagination: paginationState,
        },
        manualPagination: serverSidePagination,
        manualFiltering: serverSideSearch,
        pageCount: serverSidePagination
            ? Math.max(1, Math.ceil((totalItems ?? data.length) / Math.max(1, paginationState.pageSize)))
            : undefined,
        enableRowSelection,
        enableColumnResizing,
        enableSorting,
        onSortingChange: (updater) => {
            setSorting(updater);
            onSortingChange?.(typeof updater === 'function' ? updater(sorting) : updater);
        },
        onColumnFiltersChange: (updater) => {
            setColumnFilters(updater);
            onColumnFiltersChange?.(typeof updater === 'function' ? updater(columnFilters) : updater);
        },
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            setRowSelection(updater);
            const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
            onRowSelectionChange?.(selectedRows);
        },
        onPaginationChange: handleTablePaginationChange,
        onGlobalFilterChange: serverSideSearch ? undefined : setGlobalFilterValue,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const tablePagination = table.getState().pagination;
    const effectiveRowModel = serverSideSearch ? table.getRowModel() : table.getFilteredRowModel();
    const totalRowCount = serverSidePagination ? (totalItems ?? data.length) : effectiveRowModel.rows.length;
    const pageStart = totalRowCount === 0 ? 0 : tablePagination.pageIndex * tablePagination.pageSize + 1;
    const pageEnd = totalRowCount === 0 ? 0 : Math.min((tablePagination.pageIndex + 1) * tablePagination.pageSize, totalRowCount);
    const pageStartLabel = totalRowCount === 0 ? 0 : pageStart;
    const pageEndLabel = totalRowCount === 0 ? 0 : pageEnd;

    // Helper functions
    const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
    const hasSelectedRows = selectedRows.length > 0;

    const handleExport = useCallback((format: 'csv' | 'pdf') => {
        try {
            const csvConfig = exportConfig?.csv;
            const pdfConfig = exportConfig?.pdf;

            if (format === 'csv' && csvConfig?.enabled === false) {
                onExportError?.(format, 'CSV export is disabled.');
                return;
            }

            if (format === 'pdf' && pdfConfig?.enabled === false) {
                onExportError?.(format, 'PDF export is disabled.');
                return;
            }

            onExportStart?.(format);

            const dataToExport = table.getFilteredRowModel().rows.map(row => row.original);
            const mapRow = format === 'csv' ? csvConfig?.customMapping : pdfConfig?.customMapping;

            const defaultAccessorKeys = columns.map((col, index) => {
                const key = (col as any).accessorKey || (col as any).id;
                return key ?? `column_${index}`;
            });

            const getHeaderLabel = (col: ColumnDef<TData, TValue>, index: number) => {
                const metaLabel = (col as any).meta?.label;
                if (typeof metaLabel === 'string' && metaLabel.trim().length > 0) {
                    return metaLabel;
                }
                const header = col.header as unknown;
                if (typeof header === 'string') {
                    return header;
                }
                if (typeof header === 'number') {
                    return String(header);
                }
                if (typeof header === 'object' && header && 'toString' in header) {
                    const text = String(header);
                    if (text !== '[object Object]') {
                        return text;
                    }
                }
                const accessor = (col as any).accessorKey || (col as any).id;
                return accessor ?? `Column ${index + 1}`;
            };

            const buildRows = () => {
                if (mapRow) {
                    const mapped = dataToExport.map(mapRow);
                    const headerKeys = Array.from(
                        new Set(
                            mapped.flatMap(item => Object.keys(item ?? {}))
                        )
                    );
                    return {
                        headerLabels: headerKeys,
                        rows: mapped.map(item => headerKeys.map(key => item?.[key] ?? '')),
                    };
                }

                const headerLabels = columns.map(getHeaderLabel);
                const rows = dataToExport.map(row =>
                    defaultAccessorKeys.map(key => {
                        const value = key ? (row as any)?.[key] : '';
                        return value ?? '';
                    })
                );
                return { headerLabels, rows };
            };

            const { headerLabels, rows } = buildRows();
            const recordCount = rows.length;

            if (format === 'pdf') {
                const resolvedTitle = pdfConfig?.title ?? exportTitle ?? pdfConfig?.filename ?? exportFilename;
                const statsSection = pdfConfig?.includeStats
                    ? `<p style="margin-bottom: 12px; font-size: 12px; color: #555;">Rows exported: ${recordCount}</p>`
                    : '';

                const tableHeader = headerLabels.map(label =>
                    `<th style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5; text-align: left;">${label}</th>`
                ).join('');

                const tableRows = rows.map(cells =>
                    `<tr>${cells.map(value =>
                        `<td style="border: 1px solid #ccc; padding: 8px;">${String(value ?? '')}</td>`
                    ).join('')}</tr>`
                ).join('');

                const printDiv = document.createElement('div');
                printDiv.style.position = 'absolute';
                printDiv.style.left = '-9999px';
                printDiv.style.top = '-9999px';
                printDiv.style.width = '100%';
                printDiv.style.backgroundColor = 'white';
                printDiv.style.padding = '20px';
                printDiv.style.fontFamily = 'Arial, sans-serif';

                printDiv.innerHTML = `
                    <div>
                        <h2 style="margin-bottom: 12px;">${resolvedTitle}</h2>
                        ${statsSection}
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>${tableHeader}</tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                `;

                document.body.appendChild(printDiv);

                const originalContents = document.body.innerHTML;
                document.body.innerHTML = printDiv.innerHTML;
                window.print();
                document.body.innerHTML = originalContents;
                document.body.removeChild(printDiv);
            } else {
                const includeHeaders = csvConfig?.includeHeaders ?? true;
                const filename = `${csvConfig?.filename ?? exportFilename}.csv`;

                const formatCsvValue = (value: unknown) => {
                    const stringValue = String(value ?? '');
                    return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                };

                const csvLines = rows.map(cells =>
                    cells.map(formatCsvValue).join(',')
                );

                if (includeHeaders) {
                    csvLines.unshift(headerLabels.map(formatCsvValue).join(','));
                }

                const csv = csvLines.join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            }

            onExportComplete?.(format, recordCount);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Export failed';
            onExportError?.(format, errorMessage);
        }
    }, [table, columns, exportFilename, exportTitle, exportConfig, onExportStart, onExportComplete, onExportError]);

    const densityStyles = {
        compact: "text-xs [&_td]:py-1 [&_th]:py-1",
        normal: "text-sm [&_td]:py-2 [&_th]:py-2",
        comfortable: "text-sm [&_td]:py-3 [&_th]:py-3"
    };

    const csvExportDisabled = exportConfig?.csv?.enabled === false;
    const pdfExportDisabled = exportConfig?.pdf?.enabled === false;

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-4">
                {title && <Skeleton className="h-8 w-64" />}
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 bg-background shadow-lg p-3 rounded-md" role="region" aria-label={ariaLabel} aria-description={ariaDescription}>
            {/* Header Section */}
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    )}
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col gap-4">
                {/* Top Row - Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search and Filters */}
                    <div className="flex flex-1 flex-col sm:flex-row gap-2 items-start sm:items-center">
                        {/* Global Search */}
                        {globalFilter && (
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    value={globalFilterValue}
                                    onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setGlobalFilterValue(nextValue);
                                    }}
                                    className="pl-8 w-full h-9 sm:w-[250px]"
                                />
                            </div>
                        )}

                        {/* Column-specific Search */}
                        {searchKey && (
                            <div className="relative">
                                <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={`Filter by ${searchKey}...`}
                                    value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        table.getColumn(searchKey)?.setFilterValue(value);
                                        if (serverSideSearch) {
                                            setGlobalFilterValue(value);
                                        }
                                    }}
                                    className="pl-8 w-full sm:w-[200px]"
                                />
                            </div>
                        )}

                        {/* Active Filters Indicator */}
                        {table.getState().columnFilters.length > 0 && (
                            <Badge variant="secondary" className="hidden sm:inline-flex">
                                {table.getState().columnFilters.length} filter(s)
                            </Badge>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Refresh Button */}
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                                {!isMobile && "Refresh"}
                            </Button>
                        )}

                        {/* Export Dropdown */}
                        {enableExport && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        {!isMobile && "Export"}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Export as</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        disabled={csvExportDisabled}
                                        onSelect={() => {
                                            if (!csvExportDisabled) {
                                                handleExport('csv');
                                            }
                                        }}
                                        className={cn(!csvExportDisabled && "cursor-pointer")}
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={pdfExportDisabled}
                                        onSelect={() => {
                                            if (!pdfExportDisabled) {
                                                handleExport('pdf');
                                            }
                                        }}
                                        className={cn(!pdfExportDisabled && "cursor-pointer")}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Column Visibility */}
                        {showColumnVisibility && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <Columns3 className="h-4 w-4" />
                                        {!isMobile && "Columns"}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) =>
                                                        column.toggleVisibility(!!value)
                                                    }
                                                >
                                                    {column.columnDef.header?.toString() || column.id}
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Settings Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Table settings</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={currentDensity === 'compact'}
                                    onCheckedChange={(checked) => {
                                        setCurrentDensity(checked ? 'compact' : 'normal');
                                    }}
                                >
                                    Compact view
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={isStriped}
                                    onCheckedChange={(checked) => {
                                        setIsStriped(!!checked);
                                    }}
                                >
                                    Striped rows
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={isBordered}
                                    onCheckedChange={(checked) => {
                                        setIsBordered(!!checked);
                                    }}
                                >
                                    Show borders
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {hasSelectedRows && bulkActions && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
                        <Badge variant="secondary">
                            {selectedRows.length} selected
                        </Badge>
                        <div className="flex items-center gap-1">
                            {bulkActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Button
                                        key={index}
                                        variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                                        size="sm"
                                        onClick={() => action.onClick(selectedRows)}
                                        className="flex items-center gap-2"
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        {action.label}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => table.resetRowSelection()}
                            className="ml-auto"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            {isMobile && mobileCardRender ? (
                <div className="space-y-3">
                    {table.getRowModel().rows.map((row) => (
                        <div
                            key={row.id}
                            onClick={() => onRowClick?.(row.original)}
                        >
                            {mobileCardRender(row.original)}
                        </div>
                    ))}
                </div>
            ) : (
                /* Desktop Table View */
                <div className={cn(
                    "rounded-md border",
                    isBordered && "border-border",
                    !isBordered && "border-none"
                )}>
                    <Table className={cn(
                        densityStyles[currentDensity],
                        isStriped && "[&_tbody_tr:nth-child(odd)]:bg-muted/25"
                    )}>
                        <TableHeader className={cn(
                            stickyHeader && "sticky top-0 z-10 bg-background"
                        )}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const canSort = header.column.getCanSort();
                                        const sorted = header.column.getIsSorted();

                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    canSort && "cursor-pointer select-none hover:bg-muted/50",
                                                    "transition-colors"
                                                )}
                                                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                                style={{
                                                    width: enableColumnResizing ? header.getSize() : undefined
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    {canSort && (
                                                        <div className="flex flex-col">
                                                            {sorted === 'asc' ? (
                                                                <ArrowUp className="h-3 w-3" />
                                                            ) : sorted === 'desc' ? (
                                                                <ArrowDown className="h-3 w-3" />
                                                            ) : (
                                                                <ArrowUpDown className="h-3 w-3 opacity-50" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Column Resizer */}
                                                {enableColumnResizing && header.column.getCanResize() && (
                                                    <div
                                                        className="absolute right-0 top-0 h-full w-1 bg-border opacity-0 hover:opacity-100 cursor-col-resize"
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                    />
                                                )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className={cn(
                                            onRowClick && "cursor-pointer hover:bg-muted/50",
                                            "transition-colors"
                                        )}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={enhancedColumns.length}
                                        className="h-24 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="text-muted-foreground">{emptyMessage}</div>
                                            {table.getState().columnFilters.length > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => table.resetColumnFilters()}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Footer with Table Info and Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Table Info */}
                {showTableInfo && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                            Showing {pageStartLabel} to {pageEndLabel} of {totalRowCount} result(s)
                        </div>
                        {hasSelectedRows && (
                            <div>
                                {selectedRows.length} of {effectiveRowModel.rows.length} row(s) selected
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination && (
                    <div className="flex items-center gap-2">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    const newSize = Number(value);
                                    table.setPageSize(newSize);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {pageSizeOptions.map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page Navigation */}
                        <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{' '}
                                {table.getPageCount()}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                    className="h-8 w-8 p-0"
                                    aria-label="Go to first page"
                                >
                                    «
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    className="h-8 w-8 p-0"
                                    aria-label="Go to previous page"
                                >
                                    ‹
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    className="h-8 w-8 p-0"
                                    aria-label="Go to next page"
                                >
                                    ›
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                    className="h-8 w-8 p-0"
                                    aria-label="Go to last page"
                                >
                                    »
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}