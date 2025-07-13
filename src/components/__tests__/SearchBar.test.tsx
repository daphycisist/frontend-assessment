import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { vi } from 'vitest'
import { SearchBar } from '../SearchBar'

// Mock the utility functions
vi.mock('../../utils/analyticsEngine', () => ({
  analyzeSearchPatterns: vi.fn(() => ({ segments: 10, unique: 8, score: 80 }))
}))

vi.mock('../../utils/stringFunc', () => ({
  generateSuggestions: vi.fn(() => ['suggestion 1', 'suggestion 2', 'suggestion 3']),
  normalizeSearchInput: vi.fn((input: string) => input.toLowerCase().trim())
}))

// Mock the useClickOutside hook
vi.mock('../../hooks', () => ({
  useClickOutside: vi.fn(() => ({ current: null }))
}))

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('SearchBar', () => {
  const mockOnSearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.setItem.mockClear()
    mockConsoleLog.mockClear()
  })

  describe('Rendering', () => {
    it('should render search bar with default placeholder', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Search transactions' })).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<SearchBar onSearch={mockOnSearch} placeholder="Custom placeholder" />)

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('should show loading spinner when isLoading is true', () => {
      render(<SearchBar onSearch={mockOnSearch} isLoading={true} />)

      expect(screen.getByText('', { selector: '.spinner' })).toBeInTheDocument()
    })

    it('should not show clear button when search term is empty', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      expect(screen.queryByRole('button', { name: 'Clear search input' })).not.toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('should update search term when typing', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Search transactions...')
      fireEvent.change(input, { target: { value: 'test search' } })

      expect(input).toHaveValue('test search')
    })

    it('should show clear button when search term exists', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Search transactions...')
      fireEvent.change(input, { target: { value: 'test' } })

      expect(screen.getByRole('button', { name: 'Clear search input' })).toBeInTheDocument()
    })

    it('should clear search term when clear button is clicked', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Search transactions...')
      fireEvent.change(input, { target: { value: 'test' } })
      
      const clearButton = screen.getByRole('button', { name: 'Clear search input' })
      fireEvent.click(clearButton)

      expect(input).toHaveValue('')
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('should perform security validation for long inputs', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Search transactions...')
      const longInput = 'this is a very long search term that should trigger security validation'
      
      fireEvent.change(input, { target: { value: longInput } })

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'lastSearchSecurity',
        expect.any(String)
      )
    })
  })

  describe('Component State Management', () => {
    it('should maintain search term state correctly', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const input = screen.getByPlaceholderText('Search transactions...')
      
      fireEvent.change(input, { target: { value: 'first' } })
      expect(input).toHaveValue('first')
      
      fireEvent.change(input, { target: { value: 'second' } })
      expect(input).toHaveValue('second')
    })
    
  })
})
