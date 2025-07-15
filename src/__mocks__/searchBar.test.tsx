import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../components/SearchBar";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="icon-clear" />,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe("SearchBar", () => {
  const mockOnSearch = jest.fn();
  const mockSearchHistory = ["starbucks", "netflix"];

  beforeEach(() => {
    mockOnSearch.mockClear();
    localStorageMock.clear();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSearchHistory));
    localStorageMock.setItem.mockClear();
  });

  it("renders with input and placeholder", () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByLabelText(/search transactions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search transactions/i)).toBeInTheDocument();
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("shows suggestions and highlights matched term", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "star");
    // No timers needed since there's no debounce
    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      const option = within(listbox).getByRole("option", {
        name: (_content, element) =>
          element?.textContent?.toLowerCase().includes("starbucks") || false,
      });
      expect(option).toBeInTheDocument();
      expect(within(option).getByText(/star/i, { selector: "strong" })).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation (ArrowDown, Enter)", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "star");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("starbucks");
      expect(input).toHaveValue("starbucks");
    });
  });

  it("closes suggestions with Escape", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "star");
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("shows recent searches when input is empty and focused", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);
    await user.click(input); // Focus to show suggestions

    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(listbox).toBeInTheDocument();
      expect(screen.getByText("Recent searches")).toBeInTheDocument(); // Test history header
      const items = within(listbox).getAllByRole("option");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("starbucks");
      expect(items[1]).toHaveTextContent("netflix");
    });
  });

  it("clears input and resets search", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    await user.type(input, "star");
    expect(input).toHaveValue("star");

    await user.click(screen.getByLabelText("Clear search"));
    expect(input).toHaveValue("");
    expect(mockOnSearch).toHaveBeenLastCalledWith("");
  });

  it("has proper ARIA attributes", () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByLabelText(/search transactions/i);

    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls", "search-suggestions");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
});