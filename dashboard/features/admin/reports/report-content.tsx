'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReusableForm, FormFieldConfig } from '@/components/ui/reuseable-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useReports, useGenerateReport, useDeleteReport, useDownloadReport, Report } from '@/lib/apis/admin-reports';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Download, Trash2, Plus, RefreshCw, FileSpreadsheet, File, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { z } from 'zod';

const REPORT_TYPE_LABELS: Record<string, string> = {
  REVENUE: 'Pendapatan',
  TRANSACTION: 'Transaksi',
  BUSINESS_PERFORMANCE: 'Performa Bisnis',
  USER_ACTIVITY: 'Aktivitas User',
  SUBSCRIPTION_SUMMARY: 'Ringkasan Langganan',
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  COMPLETED: 'Selesai',
  FAILED: 'Gagal',
};

const generateSchema = z.object({
  type: z.string().min(1, 'Tipe laporan wajib dipilih'),
  period: z.string().min(1, 'Periode wajib dipilih'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

const generateFields: FormFieldConfig<GenerateFormValues>[] = [
  {
    name: 'type',
    label: 'Tipe Laporan',
    type: 'select',
    options: [
      { label: 'Pendapatan', value: 'REVENUE' },
      { label: 'Transaksi', value: 'TRANSACTION' },
      { label: 'Performa Bisnis', value: 'BUSINESS_PERFORMANCE' },
      { label: 'Aktivitas User', value: 'USER_ACTIVITY' },
      { label: 'Ringkasan Langganan', value: 'SUBSCRIPTION_SUMMARY' },
    ],
  },
  {
    name: 'period',
    label: 'Periode',
    type: 'select',
    options: [
      { label: 'Harian', value: 'DAILY' },
      { label: 'Mingguan', value: 'WEEKLY' },
      { label: 'Bulanan', value: 'MONTHLY' },
      { label: 'Quarterly', value: 'QUARTERLY' },
      { label: 'Tahunan', value: 'YEARLY' },
      { label: 'Custom', value: 'CUSTOM' },
    ],
  },
  {
    name: 'startDate',
    label: 'Tanggal Mulai',
    type: 'date',
    condition: (values) => values.period === 'CUSTOM',
  },
  {
    name: 'endDate',
    label: 'Tanggal Akhir',
    type: 'date',
    condition: (values) => values.period === 'CUSTOM',
  },
];

export function ReportContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters = {
    page,
    limit,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  };

  const { data, isLoading, refetch, isRefetching } = useReports(filters);
  const generateMutation = useGenerateReport();
  const deleteMutation = useDeleteReport();
  const downloadMutation = useDownloadReport();

  const processingCount = data?.data?.filter(
    (r: Report) => r.status === 'PENDING' || r.status === 'PROCESSING'
  ).length || 0;

  const handleGenerate = (values: GenerateFormValues) => {
    generateMutation.mutate(values, {
      onSuccess: () => setShowGenerateDialog(false),
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: ColumnDef<Report>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Judul',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{row.original.title}</div>
              <div className="text-xs text-muted-foreground">
                {REPORT_TYPE_LABELS[row.original.type] || row.original.type}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex items-center gap-2">
              {status === 'PENDING' && <Clock className="h-3.5 w-3.5 text-yellow-500" />}
              {status === 'PROCESSING' && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />}
              {status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              {status === 'FAILED' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
              <Badge
                variant="outline"
                className={REPORT_STATUS_COLORS[status]}
              >
                {REPORT_STATUS_LABELS[status]}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.period}</Badge>
        ),
      },
      {
        accessorKey: 'generatedByUser',
        header: 'Dibuat Oleh',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.generatedByUser.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.generatedByUser.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'fileSize',
        header: 'Ukuran',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.fileSize
              ? `${(row.original.fileSize / 1024).toFixed(1)} KB`
              : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-sm">
            {format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
          </span>
        ),
      },
    ],
    [],
  );

  const rowActions = (row: Report) => [
    ...(row.status === 'COMPLETED' && row.fileUrl
      ? [
          {
            label: 'Download PDF',
            icon: FileText,
            onClick: () => downloadMutation.mutate({ reportId: row.id, format: 'pdf' }),
          },
        ]
      : []),
    ...(row.status === 'COMPLETED' && row.excelUrl
      ? [
          {
            label: 'Download Excel',
            icon: FileSpreadsheet,
            onClick: () => downloadMutation.mutate({ reportId: row.id, format: 'xlsx' }),
          },
        ]
      : []),
    {
      label: 'Hapus',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => setDeleteId(row.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate dan kelola laporan platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Generate Laporan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Laporan Baru</DialogTitle>
              </DialogHeader>
              <ReusableForm
                schema={generateSchema}
                fields={generateFields}
                defaultValues={{
                  type: '',
                  period: '',
                  startDate: '',
                  endDate: '',
                }}
                onSubmit={handleGenerate}
                submitText="Generate"
                loadingText="Memproses..."
                withDialog={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Processing Notification */}
      {processingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {processingCount} laporan sedang diproses
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Status akan diperbarui otomatis setiap 3 detik
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laporan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.meta?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {data?.data?.filter((r: Report) => r.status === 'COMPLETED').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diproses</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data?.data?.filter((r: Report) => r.status === 'PROCESSING').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gagal</CardTitle>
            <File className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data?.data?.filter((r: Report) => r.status === 'FAILED').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Belum ada laporan. Generate laporan pertama Anda."
        tableId="admin-reports"
        rowActions={rowActions}
        actionViewType="dropdown"
        serverSidePagination
        totalItems={data?.meta?.total || 0}
        serverPage={page}
        serverLimit={limit}
        onPaginationChange={({ page: p, limit: l }) => {
          setPage(p);
          setLimit(l);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Laporan"
        description="Apakah Anda yakin ingin menghapus laporan ini? Aksi ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  );
}
