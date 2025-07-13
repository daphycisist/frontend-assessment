import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatTransactionDate,
  getDateRange,
  parseDate,
  getRelativeTime,
  daysBetween,
  generateDateArray,
  formatCurrency,
  formatNumber
} from '../dateHelpers'

describe('dateHelpers', () => {
  beforeEach(() => {
    // Reset any date mocks
    vi.useRealTimers()
  })

  describe('formatTransactionDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatTransactionDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('getDateRange', () => {
    it('should return date range with default 1 month', () => {
      const range = getDateRange()
      expect(range.start).toBeInstanceOf(Date)
      expect(range.end).toBeInstanceOf(Date)
      expect(range.start.getTime()).toBeLessThan(range.end.getTime())
    })

    it('should return date range for specified months', () => {
      const range = getDateRange(3)
      expect(range.start).toBeInstanceOf(Date)
      expect(range.end).toBeInstanceOf(Date)
    })
  })

  describe('parseDate', () => {
    it('should parse valid ISO date string', () => {
      const dateString = '2024-01-15T10:30:00Z'
      const parsed = parseDate(dateString)
      expect(parsed).toBeInstanceOf(Date)
      expect(parsed.getFullYear()).toBe(2024)
    })

    it('should return current date for invalid string', () => {
      const parsed = parseDate('invalid-date')
      expect(parsed).toBeInstanceOf(Date)
    })
  })

  describe('getRelativeTime', () => {
    it('should return relative time string', () => {
      const date = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      const relative = getRelativeTime(date)
      expect(relative).toMatch(/ago/)
    })
  })

  describe('daysBetween', () => {
    it('should calculate days between dates correctly', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-05')
      expect(daysBetween(start, end)).toBe(4)
    })

    it('should handle same dates', () => {
      const date = new Date('2024-01-01')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('should handle negative differences', () => {
      const start = new Date('2024-01-05')
      const end = new Date('2024-01-01')
      expect(daysBetween(start, end)).toBe(-4)
    })
  })

  describe('generateDateArray', () => {
    it('should generate array of dates between start and end', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-03')
      const dates = generateDateArray(start, end)
      
      expect(dates).toHaveLength(3)
      expect(dates[0]).toEqual(start)
      expect(dates[2]).toEqual(end)
    })

    it('should handle single day range', () => {
      const date = new Date('2024-01-01')
      const dates = generateDateArray(date, date)
      expect(dates).toHaveLength(1)
      expect(dates[0]).toEqual(date)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default locale', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format negative currency', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })
  })

  describe('formatNumber', () => {
    it('should format number with default locale', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
    })

    it('should format integer without decimals', () => {
      expect(formatNumber(1234)).toBe('1,234')
    })

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.56)).toBe('-1,234.56')
    })
  })
})
