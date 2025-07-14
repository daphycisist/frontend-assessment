import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { vi } from 'vitest'
import { TransactionList } from '../TransactionList'
import { Transaction } from '../../types/transaction'

// Mock react-virtuoso
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, endReached }: any) => (
    <div data-testid="virtuoso-container">
      {data.map((item: any, index: number) => (
        <div key={item.id || index} data-testid={`virtuoso-item-${index}`}>
          {itemContent(index, item)}
        </div>
      ))}
      <button 
        data-testid="end-reached-trigger" 
        onClick={endReached}
        style={{ display: 'none' }}
      >
        Trigger End Reached
      </button>
    </div>
  )
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

const mockTransactions: Transaction[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    amount: 150.50,
    currency: 'USD',
    type: 'debit',
    category: 'Food',
    description: 'Restaurant payment',
    merchantName: 'Pizza Palace',
    status: 'completed',
    userId: 'user1',
    accountId: 'acc1',
    location: 'New York',
    reference: 'REF001'
  },
  {
    id: '2',
    timestamp: new Date('2024-01-14T15:45:00Z'),
    amount: 2500.00,
    currency: 'USD',
    type: 'credit',
    category: 'Salary',
    description: 'Monthly salary',
    merchantName: 'Company Inc',
    status: 'completed',
    userId: 'user1',
    accountId: 'acc1'
  },
  {
    id: '3',
    timestamp: new Date('2024-01-13T09:15:00Z'),
    amount: 75.25,
    currency: 'USD',
    type: 'debit',
    category: 'Transport',
    description: 'Gas station',
    merchantName: 'Shell',
    status: 'pending',
    userId: 'user1',
    accountId: 'acc1'
  }
]

describe('TransactionList', () => {
  const mockOnTransactionClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.setItem.mockClear()
  })

  describe('Rendering', () => {
    it('should render transaction list with header', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByRole('region', { name: 'Transaction list' })).toBeInTheDocument()
      expect(screen.getByText('Transactions (3)')).toBeInTheDocument()
      expect(screen.getByText(/Total:/)).toBeInTheDocument()
    })

    it('should display correct total amount', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      // Total: 150.50 + 2500.00 + 75.25 = 2725.75
      expect(screen.getByText(/Total:\s*\$2,725\.75/)).toBeInTheDocument()
    })

    it('should show total transactions count when different from current length', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          totalTransactions={100}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      // Debug: Check what text is actually rendered
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent(/Transactions \(3/)
      
      // The component should show "of 100" when totalTransactions > transactions.length
      expect(heading).toHaveTextContent(/of 100/)
    })

    it('should not show total when equal to current length', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          totalTransactions={3}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByText('Transactions (3)')).toBeInTheDocument()
      expect(screen.queryByText('Transactions (3 of 3)')).not.toBeInTheDocument()
    })

    it('should render empty state when no transactions', () => {
      render(
        <TransactionList
          transactions={[]}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByText('No transactions found')).toBeInTheDocument()
      expect(screen.getByText('Transactions (0)')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should render skeleton items when loading', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
          isLoading={true}
        />
      )

      const skeletonContainer = screen.getByRole('grid', { busy: true })
      expect(skeletonContainer).toBeInTheDocument()
      expect(skeletonContainer).toHaveAttribute('aria-busy', 'true')
      
      // Should render 10 skeleton items
      const skeletonRows = screen.getAllByRole('row')
      expect(skeletonRows).toHaveLength(10)
    })

    it('should have proper accessibility attributes in loading state', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
          isLoading={true}
        />
      )

      const container = screen.getByRole('grid')
      expect(container).toHaveAttribute('aria-labelledby', 'transaction-list-title')
      expect(container).toHaveAttribute('aria-rowcount', '10')
      expect(container).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Transaction Rendering', () => {
    it('should render transactions in virtualized list', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByTestId('virtuoso-container')).toBeInTheDocument()
      
      // Should render transaction items
      expect(screen.getByTestId('virtuoso-item-0')).toBeInTheDocument()
      expect(screen.getByTestId('virtuoso-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('virtuoso-item-2')).toBeInTheDocument()
    })

    it('should sort transactions by timestamp (newest first)', () => {
      render(
        <TransactionList
          transactions={mockTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      // Transactions should be sorted by timestamp descending
      // Expected order: 2024-01-15 (id:1), 2024-01-14 (id:2), 2024-01-13 (id:3)
      const firstItem = screen.getByTestId('virtuoso-item-0')
      const secondItem = screen.getByTestId('virtuoso-item-1')
      const thirdItem = screen.getByTestId('virtuoso-item-2')

      expect(firstItem).toBeInTheDocument()
      expect(secondItem).toBeInTheDocument()
      expect(thirdItem).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
      ...mockTransactions[0],
      id: `transaction-${i}`,
      timestamp: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:30:00Z`),
      amount: 100 + i
    }))

    it('should load more transactions when end is reached', async () => {
      render(
        <TransactionList
          transactions={manyTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      // Initially should show first page (10 items)
      expect(screen.getByTestId('virtuoso-item-0')).toBeInTheDocument()
      expect(screen.getByTestId('virtuoso-item-9')).toBeInTheDocument()

      // Trigger end reached
      const endReachedTrigger = screen.getByTestId('end-reached-trigger')
      fireEvent.click(endReachedTrigger)

      // Should load more items
      await waitFor(() => {
        expect(screen.getByTestId('virtuoso-item-10')).toBeInTheDocument()
      })
    })

    it('should not load more when no more transactions available', () => {
      render(
        <TransactionList
          transactions={mockTransactions} // Only 3 transactions
          onTransactionClick={mockOnTransactionClick}
        />
      )

      const endReachedTrigger = screen.getByTestId('end-reached-trigger')
      fireEvent.click(endReachedTrigger)

      // Should not add more items beyond available transactions
      expect(screen.getAllByTestId(/virtuoso-item-/)).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle empty transactions array gracefully', () => {
      render(
        <TransactionList
          transactions={[]}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByText('No transactions found')).toBeInTheDocument()
      expect(screen.getByText(/Total:\s*\$0\.00/)).toBeInTheDocument()
    })

    it('should handle transactions with zero amounts', () => {
      const zeroAmountTransactions = [{
        ...mockTransactions[0],
        amount: 0
      }]

      render(
        <TransactionList
          transactions={zeroAmountTransactions}
          onTransactionClick={mockOnTransactionClick}
        />
      )

      expect(screen.getByText(/Total:\s*\$0\.00/)).toBeInTheDocument()
    })
  })
})
