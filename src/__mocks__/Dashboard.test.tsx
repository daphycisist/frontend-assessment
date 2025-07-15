/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cleanup } from '@testing-library/react';
import { Suspense } from 'react';
import { Dashboard } from '../components/Dashboard';
import { Transaction, TransactionSummary } from '../types/transaction';
import { calculateSummary, startDataRefresh, stopDataRefresh } from '../utils/dataGenerator';
import { generateRiskAssessment } from '../utils/analyticsEngine';
import { useUserContext } from '../hooks/useUserContext';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useRiskAnalytics } from '../hooks/useRiskAnalytics';
import { useSearchAndSummary } from '../hooks/useSearchAndSummary';
import { generateTransactionData } from '../utils/worker';

(globalThis as any).requestIdleCallback = (cb: (val: any) => void) =>
  setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

(globalThis as any).cancelIdleCallback = clearTimeout;

// beforeAll(() => {
//   global.requestIdleCallback = (cb) =>
//     setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);

//   global.cancelIdleCallback = (id) => clearTimeout(id);
// });

// Mock dependencies
jest.mock('../utils/dataGenerator', () => ({
  calculateSummary: jest.fn(),
  startDataRefresh: jest.fn(),
  stopDataRefresh: jest.fn(),
}));
jest.mock('../utils/analyticsEngine', () => ({
  generateRiskAssessment: jest.fn(),
}));
jest.mock('../utils/worker', () => ({
  generateTransactionData: jest.fn(),
}));
jest.mock('../hooks/useUserContext', () => ({
  useUserContext: jest.fn(),
}));
jest.mock('../hooks/useTransactionFilters', () => ({
  useTransactionFilters: jest.fn(),
}));
jest.mock('../hooks/useRiskAnalytics', () => ({
  useRiskAnalytics: jest.fn(),
}));
jest.mock('../hooks/useSearchAndSummary', () => ({
  useSearchAndSummary: jest.fn(),
}));
jest.mock('../components/SearchBar', () => ({
  SearchBar: ({ onSearch }: { onSearch: (e: string) => void }) => (
    <input data-testid="search-bar" onChange={(e: { target: { value: string } }) => onSearch(e.target.value)} />
  ),
}));
jest.mock('../components/TransactionFilters', () => ({
  TransactionFilters: (
    {
      filters,
      setFilters,
    }: { filters: any, setFilters: (val: any) => void },
  ) => (
    <select
      data-testid="filter-type"
      value={filters.type}
      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
    >
      <option value="all">All</option>
      <option value="credit">Credit</option>
    </select>
  ),
}));
jest.mock('../components/DashboardNav', () => ({
  DashboardNav: () => <div data-testid="dashboard-nav">Nav</div>,
}));
jest.mock('../components/TransactionList', () => ({
  __esModule: true,
  default: (
    {
      transactions,
      onTransactionClick,
    }: { transactions: Transaction[], onTransactionClick: (v: any) => void },
  ) => (
    <div data-testid="transaction-list">
      {transactions.map((t: Transaction) => (
        <div
          key={t.id}
          data-testid={`transaction-${t.id}`}
          onClick={() => onTransactionClick(t)}
          role="button"
        >
          {t.merchantName} - ${t.amount}
        </div>
      ))}
    </div>
  ),
}));
jest.mock('../components/TransactionView', () => ({
  __esModule: true,
  default: (
    {
      selectedTransaction,
      handleCloseTransactionView,
    }: { selectedTransaction: Transaction, handleCloseTransactionView: () => void },) => (
    <div data-testid="transaction-view">
      {selectedTransaction.merchantName}
      <button data-testid="close-view" onClick={handleCloseTransactionView}>
        Close
      </button>
    </div>
  ),
}));
jest.mock('../ui/PageLoader', () => ({
  PageLoader: () => <div data-testid="page-loader">Loading...</div>,
}));
jest.mock('../ui/LoadingTransaction', () => ({
  LoadingTransaction: ({ message }: { message?: string }) => (
    <div data-testid="loading-transaction">{message || 'Loading...'}</div>
  ),
}));
jest.mock('../components/ViewCard', () => ({
  ViewCard: (
    {
      name,
      value,
      ariaLabel,
    }: { name: string, value: string, ariaLabel: string }) => (
    <div data-testid={`view-card-${name}`} aria-label={ariaLabel}>
      {name}: {value}
    </div>
  ),
}));
jest.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('lucide-react', () => ({
  DollarSign: () => <span />,
  TrendingUp: () => <span />,
  TrendingDown: () => <span />,
  Clock: () => <span />,
}));

describe('Dashboard', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '0',
      merchantName: 'Watmart',
      amount: 60,
      timestamp: new Date('2025-07-15'),
      category: 'Retail',
      userId: 'user1',
      currency: 'USD',
      type: 'debit',
      description: 'txn_',
      status: 'failed',
      accountId: '676',
    },
    {
      id: '1',
      merchantName: 'Amazon',
      amount: 60,
      timestamp: new Date('2025-07-15'),
      category: 'Retail',
      userId: 'user1',
      currency: 'USD',
      type: 'credit',
      description: 'txn_',
      status: 'completed',
      accountId: '676',
    },
    {
      id: '2',
      merchantName: 'Starbucks',
      amount: 60,
      timestamp: new Date('2025-07-14'),
      category: 'Food',
      userId: 'user1',
      currency: 'USD',
      type: 'credit',
      description: 'txn_',
      status: 'completed',
      accountId: '676',
    },
  ];
  const mockSummary: TransactionSummary = {
    totalAmount: 180,
    totalCredits: 120,
    totalDebits: 60,
    totalTransactions: 3,
    avgTransactionAmount: 60,
    categoryCounts: { Retail: 2, Food: 1 },
  };
  const mockUserContext = {
    globalSettings: { theme: 'light', currency: 'USD' },
    trackActivity: jest.fn(),
  };
  const mockApplyFilters = jest.fn();
  const mockHandleSearch = jest.fn();
  const mockRunAdvancedAnalytics = jest.fn();

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
    (useUserContext as jest.Mock).mockReturnValue(mockUserContext);
    (useTransactionFilters as jest.Mock).mockReturnValue({ applyFilters: mockApplyFilters });
    (useSearchAndSummary as jest.Mock).mockReturnValue({ handleSearch: mockHandleSearch });
    (useRiskAnalytics as jest.Mock).mockReturnValue({ runAdvancedAnalytics: mockRunAdvancedAnalytics });
    (calculateSummary as jest.Mock).mockReturnValue(mockSummary);
    (generateTransactionData as jest.Mock).mockImplementation(({ onChunk, onProgress, onDone }) => {
      onChunk(mockTransactions);
      onProgress(100);
      onDone();
    });
    (generateRiskAssessment as jest.Mock).mockReturnValue({ processingTime: 300 });
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    cleanup();
    jest.clearAllMocks();
  });

  it('renders PageLoader when loading', async () => {
    render(<Dashboard />);
    expect(screen.getByTestId('loading-transaction')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('loading-transaction')).not.toBeInTheDocument();
    });
  });

  it('renders dashboard components after loading', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
      expect(screen.getByTestId('view-card-Total Amount')).toHaveTextContent('Total Amount: 180');
      expect(screen.getByTestId('view-card-Total Credits')).toHaveTextContent('Total Credits: 120');
      expect(screen.getByTestId('view-card-Total Debits')).toHaveTextContent('Total Debits: 60');
      expect(screen.getByTestId('transaction-list')).toHaveTextContent('Amazon - $60');
    });
  });

  it('handles search input', async () => {
    const user = userEvent.setup();
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('search-bar'), 'Amazon');
    expect(mockHandleSearch).toHaveBeenCalledWith('Amazon');
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('filter-type')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByTestId('filter-type'), 'credit');
    expect(mockApplyFilters).toHaveBeenCalled();
  });

  // it('handles transaction click and shows TransactionView', async () => {
  //   const user = userEvent.setup();
  //   render(
  //     <Suspense fallback={<div>Loading...</div>}>
  //       <Dashboard />
  //     </Suspense>
  //   );

  //   const transactions = screen.getAllByTestId('transaction-1');
  //   await waitFor(() => {
  //     expect(transactions.length).toBeGreaterThan(0);
  //     // fireEvent.click(transactions[0]);
  //     // expect(screen.getByTestId('transaction-1')).toBeInTheDocument();
  //   });

  //   await user.click(screen.getByTestId('transaction-1'));
  //   await waitFor(() => {
  //     expect(screen.getByTestId('transaction-view')).toBeInTheDocument();
  //     expect(screen.getByTestId('transaction-view')).toHaveTextContent('Amazon');
  //   });

  //   await user.click(screen.getByTestId('close-view'));
  //   await waitFor(() => {
  //     expect(screen.queryByTestId('transaction-view')).not.toBeInTheDocument();
  //   });
  // });

  // it('updates summary when filteredTransactions change', async () => {
  //   render(
  //     <Suspense fallback={<div>Loading...</div>}>
  //       <Dashboard />
  //     </Suspense>
  //   );
  //   const mockedCalculateSummary = calculateSummary as jest.Mock;
  //   await waitFor(() => {
  //     expect(mockedCalculateSummary).toHaveBeenCalledWith(expect.arrayContaining([
  //       expect.objectContaining({ id: "0" }),
  //       expect.objectContaining({ id: "1" }),
  //       expect.objectContaining({ id: "2" }),
  //     ]));
  //     expect(calculateSummary).toHaveBeenCalledWith(mockTransactions);
  //     expect(screen.getByTestId('view-card-Total Amount')).toHaveTextContent('Total Amount: 180');
  //   });
  // });

  // it('runs risk assessment for large datasets', async () => {
  //   (generateTransactionData as jest.Mock).mockImplementationOnce(({ onChunk, onProgress, onDone }) => {
  //     onChunk(new Array(1001).fill(mockTransactions[0])); // Simulate large dataset
  //     onProgress(100);
  //     onDone();
  //   });

  //   render(
  //     <Suspense fallback={<div>Loading...</div>}>
  //       <Dashboard />
  //     </Suspense>
  //   );

  //   await waitFor(() => {
  //     expect(generateRiskAssessment).toHaveBeenCalled();
  //   });
  // });

  it('handles window events (resize, scroll, keydown)', async () => {
    const user = userEvent.setup();
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    });

    // Simulate resize
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => {
      expect(calculateSummary).toHaveBeenCalled();
    });

    // Simulate scroll
    window.dispatchEvent(new Event('scroll'));
    expect(console.log).toHaveBeenCalledWith('Scrolling...', expect.any(String));

    // Simulate Ctrl+F
    await user.keyboard('{Control>}f');
    expect(mockHandleSearch).toHaveBeenCalledWith('search');
  });

  it('handles auto-refresh with startDataRefresh', async () => {
    (startDataRefresh as jest.Mock).mockImplementation((cb) => {
      cb();
      return 'refresh-id';
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(startDataRefresh).toHaveBeenCalled();
      expect(generateTransactionData).toHaveBeenCalledWith(
        expect.objectContaining({ total: 200, chunkSize: 100 })
      );
    });
  });

  it('has proper ARIA attributes', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByRole('main', { name: 'Transaction Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Transaction statistics' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Transaction count' })).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Transaction filters' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Search and filter controls' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Transaction results' })).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('cleans up event listeners and Web Worker on unmount', async () => {
    const { unmount } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <Dashboard />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
    });

    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    expect(stopDataRefresh).toHaveBeenCalled();
    expect(screen.queryByTestId('transaction-list')).not.toBeInTheDocument();
  });
});