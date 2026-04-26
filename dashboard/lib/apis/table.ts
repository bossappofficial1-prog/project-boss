import { apiClient } from "./base";


export interface OutletTable {
  id: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  outletId: string;
  _count?: {
    orders: number;
  };
}

export const tableApi = {
  getTables: async (outletId: string): Promise<OutletTable[]> => {
    const { data } = await apiClient.get('/tables', { params: { outletId } });
    return data.data;
  },
  getTableById: async (id: string): Promise<OutletTable> => {
    const { data } = await apiClient.get(`/tables/${id}`);
    return data.data;
  },
  createTable: async (payload: { name: string; capacity: number; outletId: string }): Promise<OutletTable> => {
    const { data } = await apiClient.post('/tables', payload);
    return data.data;
  },
  updateTable: async (id: string, payload: Partial<OutletTable>): Promise<OutletTable> => {
    const { data } = await apiClient.patch(`/tables/${id}`, payload);
    return data.data;
  },
  deleteTable: async (id: string): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  },
};
