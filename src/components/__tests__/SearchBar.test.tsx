import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('debounces onSearch calls', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { getByPlaceholderText } = render(<SearchBar onSearch={onSearch} />);

    // Clear the initial call triggered by SearchBar mounting with empty value
    vi.clearAllMocks();

    const input = getByPlaceholderText('Search transactions...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Ama' } });
    fireEvent.change(input, { target: { value: 'Amaz' } });
    fireEvent.change(input, { target: { value: 'Amazon' } });

    // Fast-forward time past debounce (250ms)
    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('amazon'); // normalized lower-case

    vi.useRealTimers();
  });
});
