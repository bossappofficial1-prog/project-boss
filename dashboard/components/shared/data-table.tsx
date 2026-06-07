import React from 'react';
import { TableColumn, TableAction } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  actions?: TableAction<T>[];
  onRowClick?: (record: T) => void;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic DataTable Component
 * 
 * Reusable table dengan features:
 * - Sorting
 * - Selection (single/bulk)
 * - Row actions
 * - Loading state
 * - Empty state
 * - Custom render per column
 * 
 * @example
 * ```typescript
 * const columns: TableColumn<User>[] = [
 *   { key: 'name', title: 'Name', sortable: true },
 *   { key: 'email', title: 'Email', sortable: true },
 *   {
 *     key: 'role',
 *     title: 'Role',
 *     render: (value) => <Badge>{value}</Badge>
 *   }
 * ];
 * 
 * const actions: TableAction<User>[] = [
 *   {
 *     label: 'Edit',
 *     onClick: (user) => handleEdit(user),
 *     variant: 'default'
 *   },
 *   {
 *     label: 'Delete',
 *     onClick: (user) => handleDelete(user),
 *     variant: 'destructive'
 *   }
 * ];
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   actions={actions}
 *   selectable
 *   onSelectionChange={setSelectedIds}
 *   onSort={handleSort}
 * />
 * ```
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actions,
  onRowClick,
  sortBy = null,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'Tidak ada data',
  className = '',
}: DataTableProps<T>) {
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? data.map(item => item.id) : []);
  };

  // Handle select single row
  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = checked
      ? [...selectedIds, id]
      : selectedIds.filter(selectedId => selectedId !== id);
    onSelectionChange(newSelection);
  };

  // Check if all rows selected
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  // Render sort icon
  const renderSortIcon = (columnKey: string, isSortable: boolean) => {
    if (!isSortable || !onSort) return null;

    if (sortBy === columnKey) {
      return sortOrder === 'asc' ? (
        <ChevronUp className="ml-2 h-4 w-4 inline" />
      ) : (
        <ChevronDown className="ml-2 h-4 w-4 inline" />
      );
    }

    return <ChevronsUpDown className="ml-2 h-4 w-4 inline opacity-50" />;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && <TableHead className="w-12" />}
              {columns.map((column) => (
                <TableHead key={String(column.key)} style={{ width: column.width }}>
                  {column.title}
                </TableHead>
              ))}
              {actions && actions.length > 0 && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                {selectable && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {actions && actions.length > 0 && (
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`rounded-md border ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && <TableHead className="w-12" />}
              {columns.map((column) => (
                <TableHead key={String(column.key)} style={{ width: column.width }}>
                  {column.title}
                </TableHead>
              ))}
              {actions && actions.length > 0 && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                className="h-24 text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={isSomeSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                style={{ width: column.width }}
                className={`${column.className || ''} ${
                  column.sortable && onSort ? 'cursor-pointer select-none hover:bg-accent' : ''
                } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                onClick={() => column.sortable && onSort && onSort(String(column.key))}
              >
                {column.title}
                {renderSortIcon(String(column.key), column.sortable || false)}
              </TableHead>
            ))}
            {actions && actions.length > 0 && (
              <TableHead className="w-24 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, rowIndex) => {
            const isSelected = selectedIds.includes(record.id);

            return (
              <TableRow
                key={record.id}
                className={`${onRowClick ? 'cursor-pointer' : ''} ${
                  isSelected ? 'bg-muted/50' : ''
                }`}
                onClick={() => !selectable && onRowClick?.(record)}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectRow(record.id, checked as boolean)
                      }
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const value = record[column.key as keyof T];
                  const content = column.render
                    ? column.render(value, record, rowIndex)
                    : String(value || '-');

                  return (
                    <TableCell
                      key={String(column.key)}
                      className={`${column.className || ''} ${
                        column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                          ? 'text-right'
                          : ''
                      }`}
                    >
                      {content}
                    </TableCell>
                  );
                })}
                {actions && actions.length > 0 && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((action, actionIndex) => {
                        const isDisabled =
                          typeof action.disabled === 'function'
                            ? action.disabled(record)
                            : action.disabled;

                        const isHidden =
                          typeof action.hidden === 'function'
                            ? action.hidden(record)
                            : action.hidden;

                        if (isHidden) return null;

                        return (
                          <Button
                            key={actionIndex}
                            variant={action.variant === 'primary' ? 'default' : (action.variant || 'ghost')}
                            size="sm"
                            onClick={() => action.onClick(record)}
                            disabled={isDisabled}
                          >
                            {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
