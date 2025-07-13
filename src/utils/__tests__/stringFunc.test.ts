import { describe, it, expect, vi } from 'vitest'
import { normalizeSearchInput, generateSuggestions } from '../stringFunc'

// Mock the analytics engine to avoid complex dependencies
vi.mock('../analyticsEngine', () => ({
  calculateRelevanceScore: vi.fn((a: string, b: string) => {
    // Simple mock implementation for testing
    return a.toLowerCase().includes(b.toLowerCase()) ? 1 : 0
  })
}))

describe('stringFunc', () => {
  describe('normalizeSearchInput', () => {
    it('should convert to lowercase and trim whitespace', () => {
      expect(normalizeSearchInput('  HELLO WORLD  ')).toBe('hello world')
    })

    it('should normalize international characters', () => {
      expect(normalizeSearchInput('café')).toBe('caf')
      expect(normalizeSearchInput('naïve')).toBe('nave')
      expect(normalizeSearchInput('résumé')).toBe('rsum')
    })

    it('should remove special characters', () => {
      expect(normalizeSearchInput('hello@world!')).toBe('helloworld')
      expect(normalizeSearchInput('test#123$')).toBe('test123')
    })

    it('should handle multiple spaces', () => {
      expect(normalizeSearchInput('hello    world')).toBe('hello world')
    })

    it('should handle empty strings', () => {
      expect(normalizeSearchInput('')).toBe('')
      expect(normalizeSearchInput('   ')).toBe('')
    })

    it('should handle complex international text', () => {
      expect(normalizeSearchInput('Ñoël & François')).toBe('ol franois')
    })
  })

  describe('generateSuggestions', () => {
    it('should return filtered suggestions based on term', () => {
      const suggestions = generateSuggestions('food')
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should return empty array for non-matching terms', () => {
      const suggestions = generateSuggestions('xyz123nonexistent')
      expect(suggestions).toEqual([])
    })

    it('should handle empty search term', () => {
      const suggestions = generateSuggestions('')
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should be case insensitive', () => {
      const lowerSuggestions = generateSuggestions('food')
      const upperSuggestions = generateSuggestions('FOOD')
      expect(lowerSuggestions).toEqual(upperSuggestions)
    })

    it('should limit results to 5 items', () => {
      const suggestions = generateSuggestions('a') // Common letter likely to match many terms
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })
  })
})
