import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../components/SearchBar";

// Mock lucide-react icons
jest.mock("lucide-react");

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("SearchBar", () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
    localStorageMock.setItem.mockClear();
    localStorageMock.clear.mockClear();
    mockOnSearch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test 1: Rendering
  it("renders input, search icon, and placeholder", () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="Search transactions..." />);
    expect(screen.getByLabelText("Search transactions")).toBeInTheDocument();
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search transactions...")).toBeInTheDocument();
  });

  // Test 2: Keyboard Navigation - Suggestions
  it("navigates suggestions with ArrowUp/ArrowDown and selects with Enter", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    // Type to trigger suggestions
    await user.type(input, "ama");
    jest.advanceTimersByTime(300); // Wait for debounce
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(within(listbox).getAllByRole("option")).toHaveLength(1); // Expect "amazon"
      expect(within(listbox).getByText(/amazon/i)).toBeInTheDocument();
    }, { timeout: 1000 });

    // ArrowDown to focus first suggestion
    await user.keyboard("{ArrowDown}");
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /amazon/i });
      expect(option).toHaveAttribute("aria-selected", "true");
      expect(option).toHaveClass("focused");
      expect(input).toHaveAttribute("aria-activedescendant", "suggestion-0");
    }, { timeout: 1000 });

    // ArrowUp to reset focus
    await user.keyboard("{ArrowUp}");
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /amazon/i })).toHaveAttribute(
        "aria-selected",
        "false"
      );
      expect(input).not.toHaveAttribute("aria-activedescendant");
    }, { timeout: 1000 });

    // ArrowDown and Enter to select
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(input).toHaveValue("amazon");
      expect(mockOnSearch).toHaveBeenLastCalledWith("amazon");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(input).toHaveFocus();
    }, { timeout: 1000 });
  });

  // Test 3: Keyboard Navigation - Escape
  it("closes suggestions with Escape", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    }, { timeout: 1000 });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(input).toHaveFocus();
    }, { timeout: 1000 });
  });

  // Test 4: Debounced Search
  it("debounces search input and calls onSearch", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    await user.type(input, "test");
    expect(mockOnSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("test");
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    await user.type(input, "ing");
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("testing");
      expect(mockOnSearch).toHaveBeenCalledTimes(2);
    }, { timeout: 1000 });
  });

  // Test 5: Suggestions
  it("displays and highlights suggestions", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-live", "polite");
      const options = within(listbox).getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("amazon");
      expect(within(options[0]).getByText("ama", { selector: "strong" })).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  // Test 6: Search History
  it("displays search history when input is empty", async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(["amazon", "starbucks"]));
    render(<SearchBar onSearch={mockOnSearch} />);
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      const options = within(listbox).getAllByRole("option");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent("amazon");
      expect(options[1]).toHaveTextContent("starbucks");
    }, { timeout: 1000 });

    const input = screen.getByLabelText("Search transactions");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(input).toHaveValue("amazon");
      expect(mockOnSearch).toHaveBeenCalledWith("amazon");
    }, { timeout: 1000 });
  });

  // Test 7: Clear Button
  it("clears input and calls onSearch with empty string", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    await user.type(input, "test");
    jest.advanceTimersByTime(300);
    await user.click(screen.getByLabelText("Clear search"));
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(mockOnSearch).toHaveBeenLastCalledWith("");
      expect(input).toHaveFocus();
    }, { timeout: 1000 });
  });

  // Test 8: Accessibility
  it("has correct ARIA attributes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls", "search-suggestions");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("listbox")).toHaveAttribute("aria-live", "polite");
    }, { timeout: 1000 });
  });

  // Test 9: Debug Keyboard Navigation Failure
  it("logs key events for debugging", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText("Search transactions");

    await user.type(input, "ama");
    jest.advanceTimersByTime(300);
    await user.keyboard("{ArrowDown}");
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Key pressed: ArrowDown")
      );
      expect(screen.getByRole("option", { name: /amazon/i })).toHaveClass("focused");
    }, { timeout: 1000 });
    consoleSpy.mockRestore();
  });
});