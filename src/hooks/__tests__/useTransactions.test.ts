import { describe, it, expect } from 'vitest';
import { act } from 'react-dom/test-utils';
import { renderHook } from '@testing-library/react';
import { useTransactions } from '../useTransactions';
import { TxType, TxStatus } from '../../constants/transactions';

// Helper to wait for next tick (hooks update)
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('useTransactions', () => {
  it('filters by type', async () => {
    const { result } = renderHook(() => useTransactions(50));
    await flushPromises();

    // ensure we have both types in seed data
    const { transactions } = result.current;
    expect(transactions.some((t) => t.type === TxType.Debit)).toBe(true);
    expect(transactions.some((t) => t.type === TxType.Credit)).toBe(true);

    act(() => {
      result.current.handleFilterChange({ ...result.current.filters, type: TxType.Debit });
    });
    await flushPromises();

    const { filteredTransactions } = result.current;
    expect(filteredTransactions.every((t) => t.type === TxType.Debit)).toBe(true);
  });

  it('filters by status', async () => {
    const { result } = renderHook(() => useTransactions(50));
    await flushPromises();

    act(() => {
      result.current.handleFilterChange({ ...result.current.filters, status: TxStatus.Completed });
    });
    await flushPromises();

    expect(result.current.filteredTransactions.every((t) => t.status === TxStatus.Completed)).toBe(
      true,
    );
  });

  it('searches description/merchant', async () => {
    const { result } = renderHook(() => useTransactions(30));
    await flushPromises();

    const targetTx = result.current.transactions[0];
    const term = targetTx.merchantName.slice(0, 3); // partial search

    act(() => {
      result.current.handleSearch(term);
    });
    await flushPromises();

    expect(result.current.filteredTransactions.some((t) => t.merchantName.includes(term))).toBe(
      true,
    );
  });
});
