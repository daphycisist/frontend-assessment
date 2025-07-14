# Testing Guide

This project uses **Vitest** as the testing framework along with **React Testing Library** for component testing.

## Testing Stack

- **Vitest**: Fast unit test framework built for Vite
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for testing

## Available Test Scripts

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once and exit
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Test setup and global mocks
│   ├── test-utils.tsx    # Custom render utilities with providers
│   └── vitest.d.ts       # TypeScript declarations
├── components/
│   └── __tests__/        # Component tests
├── utils/
│   └── __tests__/        # Utility function tests
└── hooks/
    └── __tests__/        # Custom hook tests
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myUtilFunction } from '../myUtilFunction'

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('expected output')
  })
})
```

## Mocking

### External Dependencies
```typescript
import { vi } from 'vitest'

vi.mock('../external-module', () => ({
  someFunction: vi.fn(() => 'mocked result')
}))
```

### React Components
```typescript
vi.mock('../MyComponent', () => ({
  MyComponent: vi.fn(() => <div>Mocked Component</div>)
}))
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Target coverage thresholds:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Best Practices

1. **Test behavior, not implementation**
2. **Use semantic queries** (getByRole, getByLabelText, etc.)
3. **Mock external dependencies** but not internal modules
4. **Test user interactions** with user-event library
5. **Keep tests focused** - one concept per test
6. **Use descriptive test names** that explain the expected behavior

## Debugging Tests

### VS Code Integration
Add this to your VS Code settings:
```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npm run test"
}
```

### Debug Mode
```bash
# Run specific test file
npm run test -- MyComponent.test.tsx

# Run tests matching pattern
npm run test -- --grep "should render"

# Run tests in specific directory
npm run test -- src/components
```

## Performance Testing

For performance-critical components, consider:
- Testing render times
- Memory leak detection
- Large dataset handling

Example:
```typescript
it('should handle large datasets efficiently', () => {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({ id: i }))
  const { rerender } = render(<MyComponent data={largeDataset} />)
  
  // Test that component handles updates efficiently
  expect(screen.getByTestId('item-count')).toHaveTextContent('10000')
})
```
