import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import { TransactionItem } from '../TransactionItem'
import { Transaction } from '../../types/transaction'

const mockTransaction: Transaction = {
    id: '1',
    merchantName: 'Test Merchant',
    category: 'Food & Dining',
    amount: 25.50,
    description: 'Test transaction description',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    location: 'New York, NY',
    status: 'completed',
    type: 'debit',
    currency: '',
    userId: '',
    accountId: ''
}

describe('TransactionItem', () => {
  const defaultProps = {
    transaction: mockTransaction,
    isSelected: false,
    isHovered: false,
    onClick: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    rowIndex: 0
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render transaction details correctly', () => {
    render(<TransactionItem {...defaultProps} />)
    
    expect(screen.getByText('Test Merchant')).toBeInTheDocument()
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Test transaction description')).toBeInTheDocument()
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('should format debit amount with negative sign', () => {
    render(<TransactionItem {...defaultProps} />)
    
    expect(screen.getByText('-$25.50')).toBeInTheDocument()
  })

  it('should format credit amount with positive sign', () => {
    const creditTransaction = { ...mockTransaction, type: 'credit' as const }
    render(<TransactionItem {...defaultProps} transaction={creditTransaction} />)
    
    expect(screen.getByText('+$25.50')).toBeInTheDocument()
  })

  it('should format date correctly', () => {
    render(<TransactionItem {...defaultProps} />)
    
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const onClickMock = vi.fn()
    render(<TransactionItem {...defaultProps} onClick={onClickMock} />)
    
    const transactionItem = screen.getByRole('gridcell')
    fireEvent.click(transactionItem)
    
    expect(onClickMock).toHaveBeenCalledTimes(1)
  })

  it('should handle mouse events', () => {
    const onMouseEnterMock = vi.fn()
    const onMouseLeaveMock = vi.fn()
    
    render(
      <TransactionItem 
        {...defaultProps} 
        onMouseEnter={onMouseEnterMock}
        onMouseLeave={onMouseLeaveMock}
      />
    )
    
    const transactionItem = screen.getByRole('gridcell')
    
    fireEvent.mouseEnter(transactionItem)
    expect(onMouseEnterMock).toHaveBeenCalledTimes(1)
    
    fireEvent.mouseLeave(transactionItem)
    expect(onMouseLeaveMock).toHaveBeenCalledTimes(1)
  })

  it('should apply selected state correctly', () => {
    render(<TransactionItem {...defaultProps} isSelected={true} />)
    
    const transactionItem = screen.getByRole('gridcell')
    expect(transactionItem).toHaveAttribute('aria-selected', 'true')
  })

  it('should have proper accessibility attributes', () => {
    render(<TransactionItem {...defaultProps} rowIndex={5} />)
    
    const transactionItem = screen.getByRole('gridcell')
    expect(transactionItem).toHaveAttribute('aria-rowindex', '6') // rowIndex + 1
    expect(transactionItem).toHaveAttribute('tabIndex', '0')
    expect(transactionItem).toHaveAttribute('aria-describedby', 'transaction-1-details')
  })

  it('should render without location when not provided', () => {
    const transactionWithoutLocation = { ...mockTransaction, location: undefined }
    render(<TransactionItem {...defaultProps} transaction={transactionWithoutLocation} />)
    
    expect(screen.queryByText('New York, NY')).not.toBeInTheDocument()
  })

  it('should apply correct CSS classes for transaction type', () => {
    render(<TransactionItem {...defaultProps} />)
    
    const amountElement = screen.getByText('-$25.50')
    expect(amountElement).toHaveClass('amount', 'debit')
  })

  it('should apply correct status class', () => {
    render(<TransactionItem {...defaultProps} />)
    
    const statusElement = screen.getByText('completed')
    expect(statusElement).toHaveClass('transaction-status', 'completed')
  })
})
