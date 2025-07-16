import React from 'react';
import { FilterOptions } from '../types/transaction';
import { TxType, TxStatus, ALL_TYPES_OPTION, ALL_STATUS_OPTION } from '../constants/transactions';
import { SearchBar } from './SearchBar';

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onSearch: (term: string) => void;
  categories: string[];
  inputRef?: React.Ref<HTMLInputElement>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onSearch,
  categories,
  inputRef,
}) => {
  return (
    <div className="dashboard-controls">
      <SearchBar onSearch={onSearch} inputRef={inputRef} />

      <div className="filter-controls">
        <select
          value={filters.type || ALL_TYPES_OPTION}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value as TxType | 'all' })}
        >
          <option value={ALL_TYPES_OPTION}>All Types</option>
          <option value={TxType.Debit}>Debit</option>
          <option value={TxType.Credit}>Credit</option>
        </select>

        <select
          value={filters.status || ALL_STATUS_OPTION}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: e.target.value as TxStatus | 'all',
            })
          }
        >
          <option value={ALL_STATUS_OPTION}>All Status</option>
          <option value={TxStatus.Completed}>Completed</option>
          <option value={TxStatus.Pending}>Pending</option>
          <option value={TxStatus.Failed}>Failed</option>
        </select>

        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
