import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableTableHeadProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead = ({ label, sortKey, currentSort, onSort, className }: SortableTableHeadProps) => {
  const isActive = currentSort.key === sortKey;

  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && currentSort.direction === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5 text-primary" />
        ) : isActive && currentSort.direction === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5 text-primary" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
};

export function useSort(defaultKey = '', defaultDir: SortDirection = null) {
  const [sort, setSort] = useState<SortConfig>({ key: defaultKey, direction: defaultDir });

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key: '', direction: null };
      return { key, direction: 'asc' };
    });
  };

  return { sort, handleSort };
}

import { useState } from 'react';

export function sortData<T>(data: T[], sort: SortConfig, getValue: (item: T, key: string) => string | number): T[] {
  if (!sort.key || !sort.direction) return data;
  return [...data].sort((a, b) => {
    const aVal = getValue(a, sort.key);
    const bVal = getValue(b, sort.key);
    const cmp = typeof aVal === 'string' && typeof bVal === 'string'
      ? aVal.localeCompare(bVal, 'es')
      : (aVal < bVal ? -1 : aVal > bVal ? 1 : 0);
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

export default SortableTableHead;
