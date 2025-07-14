import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { TransactionItemSkeleton } from '../TransactionItemSkeleton'

describe('TransactionItemSkeleton', () => {
  it('should render skeleton structure', () => {
    render(<TransactionItemSkeleton />)
    
    const skeletonElement = screen.getByRole('gridcell')
    expect(skeletonElement).toBeInTheDocument()
    expect(skeletonElement).toHaveAttribute('aria-label', 'Loading transaction')
  })

  it('should have proper accessibility attributes', () => {
    render(<TransactionItemSkeleton />)
    
    const skeletonElement = screen.getByRole('gridcell')
    expect(skeletonElement).toHaveAttribute('aria-busy', 'true')
  })

  it('should apply skeleton CSS classes', () => {
    render(<TransactionItemSkeleton />)
    
    const skeletonElement = screen.getByRole('gridcell')
    expect(skeletonElement).toHaveClass('transaction-item', 'skeleton-item')
  })

  it('should render all skeleton elements', () => {
    render(<TransactionItemSkeleton />)
    
    // Check for skeleton elements by their classes
    const skeletonElements = document.querySelectorAll('.skeleton-line')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('should be keyboard accessible', () => {
    render(<TransactionItemSkeleton />)
    
    const skeletonElement = screen.getByRole('gridcell')
    expect(skeletonElement).toHaveAttribute('tabIndex', '0')
  })
})
