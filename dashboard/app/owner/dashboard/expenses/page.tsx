'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSelectedOutletId } from '@/hooks/useOutlet';
import { useExpenses } from '@/hooks/useExpenses';
import { expenseApi } from '@/lib/apis/expense';
import { formatDate } from '@/lib/utils/date';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = { id?: string; description: string; amount: string; date: string; category: string };

export default function ExpensesPage() {
  const { outletId } = useSelectedOutletId();
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>({});
  const { data, loading, error, totalAmount } = useExpenses(outletId, range);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ description: '', amount: '', date: new Date().toISOString().slice(0,10), category: 'OTHER' });

  const saldoText = useMemo(() => `Total Pengeluaran${range.startDate || range.endDate ? ' (rentang waktu)' : ''}: Rp ${totalAmount.toLocaleString('id-ID')}`, [totalAmount, range.startDate, range.endDate]);

  const onOpenCreate = () => { setForm({ description: '', amount: '', date: new Date().toISOString().slice(0,10), category: 'OTHER' }); setShowModal(true); };
  const onOpenEdit = (e: any) => { setForm({ id: e.id, description: e.description, amount: String(e.amount), date: e.date?.slice(0,10), category: e.category || 'OTHER' }); setShowModal(true); };

  async function onSubmit() {
    if (!outletId) return;
    setSaving(true);
    try {
      const payload = { description: form.description, amount: Number(form.amount), date: form.date, category: form.category, outletId } as any;
      if (form.id) await expenseApi.update(form.id, payload);
      else await expenseApi.create(payload);
      setShowModal(false);
      // Simple reload: re-run state by adjusting range to new object
      setRange({ ...range });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Hapus pengeluaran ini?')) return;
    await expenseApi.delete(id);
    setRange({ ...range });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-poppins">Pengeluaran</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-poppins">Catat dan kelola pengeluaran bisnis Anda</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <input type="date" value={range.startDate || ''} onChange={(e) => setRange({ ...range, startDate: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            <span className="text-gray-400">—</span>
            <input type="date" value={range.endDate || ''} onChange={(e) => setRange({ ...range, endDate: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            <button onClick={onOpenCreate} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-poppins">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Tambah Pengeluaran
            </button>
          </div>
        </div>

        {/* Saldo Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ringkasan</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{saldoText}</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deskripsi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-red-600">{error}</td></tr>
              ) : !data || data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Tidak ada data</td></tr>
              ) : (
                data.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{e.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{e.category || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {e.amount.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onOpenEdit(e)} className="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">Ubah</button>
                        <button onClick={() => onDelete(e.id)} className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? 'Ubah' : 'Tambah'} Pengeluaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Deskripsi</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contoh: Beli ATK" />
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Kategori</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="OPERATIONAL">Operasional</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <button className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Batal</button>
              </DialogClose>
              <button onClick={onSubmit} disabled={saving} className="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
