import { useQuery} from '@tanstack/react-query';
import {apiClient as api} from './base';

// Types
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  performedBy: string;
  performedByUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  total: number;
  todayCount: number;
  actionDistribution: Array<{ action: string; count: number }>;
}

// Hooks
export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const { data } = await api.get('/admin/audit-logs', { params: filters });
      return data;
    },
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['audit-logs', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/audit-logs/stats');
      return data.data as AuditLogStats;
    },
  });
}

export function useAuditLogsByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/audit-logs/entity/${entityType}/${entityId}`);
      return data.data as AuditLog[];
    },
    enabled: !!entityType && !!entityId,
  });
}
