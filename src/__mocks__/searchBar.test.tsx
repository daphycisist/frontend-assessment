import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../components/SearchBar";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="icon-search" />,
  X: () => <div data-testid="icon-clear" />,
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value }),
    clear: jest.fn(() => { store = {} }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("SearchBar", () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnSearch.mockClear();
    localStorageMock.clear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(["starbucks", "netflix"]));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders with input and placeholder", () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByLabelText(/search transactions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search transactions/i)).toBeInTheDocument();
    expect(screen.getByTestId("icon-search")).toBeInTheDocument();
  });

  it("debounces input and triggers onSearch", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "ama");
    expect(mockOnSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("ama");
    });
  });

  it("shows suggestions and highlights matched term", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      const option = within(listbox).getByRole("option", {
        name: (content, element) =>
          element?.textContent?.toLowerCase().includes("amazon") || false,
      });
      expect(option).toBeInTheDocument();
      expect(within(option).getByText(/ama/i, { selector: "strong" })).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation (ArrowDown, Enter)", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("amazon");
      expect(input).toHaveValue("amazon");
    });
  });

  it("closes suggestions with Escape", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("shows recent searches when input is empty", async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      const items = within(listbox).getAllByRole("option");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("starbucks");
      expect(items[1]).toHaveTextContent("netflix");
    });
  });

  it("clears input and resets search", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "net");
    jest.advanceTimersByTime(300);
    expect(input).toHaveValue("net");

    await user.click(screen.getByLabelText("Clear search"));
    expect(input).toHaveValue("");
    expect(mockOnSearch).toHaveBeenLastCalledWith("");
  });

  it("has proper ARIA attributes", () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls", "search-suggestions");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });
});