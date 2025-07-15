import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
// import { act } from "react";
import { SearchBar } from "../components/SearchBar";

jest.useFakeTimers();

describe("SearchBar", () => {
  const onSearchMock = jest.fn();

  beforeAll(() => {
  // Prevent "scrollIntoView is not a function" error in test env
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    onSearchMock.mockClear();
  });

  it("renders input with placeholder", () => {
    render(<SearchBar onSearch={onSearchMock} placeholder="Find something..." />);
    expect(screen.getByPlaceholderText("Find something...")).toBeInTheDocument();
  });

  it("calls onSearch when input is typed (debounced)", async () => {
    render(<SearchBar onSearch={onSearchMock} />);
    const input = screen.getByLabelText(/search transactions/i);

    fireEvent.change(input, { target: { value: "net" } });
    act(() => jest.advanceTimersByTime(300));

    await waitFor(() => expect(onSearchMock).toHaveBeenCalledWith("net"));
  });

  it("shows suggestions when input has relevant text", async () => {
    render(<SearchBar onSearch={onSearchMock} />);
    const input = screen.getByLabelText(/search transactions/i);

    fireEvent.change(input, { target: { value: "goo" } });
    act(() => jest.advanceTimersByTime(300));

    const suggestions = screen.getAllByRole("option");
    const googleOption = suggestions.find(
      (el) => el.textContent?.toLowerCase().trim() === "google"
    );
    expect(googleOption).toBeInTheDocument();
  });

  it("navigates suggestions with keyboard and selects on Enter", async () => {
    render(<SearchBar onSearch={onSearchMock} />);
    const input = screen.getByLabelText(/search transactions/i);

    fireEvent.change(input, { target: { value: "net" } });
    act(() => jest.advanceTimersByTime(300));

    const suggestionItems = screen.getAllByRole("option");

    const netflixOption = suggestionItems.find(
      (el) => el.textContent?.toLowerCase().trim() === "netflix"
    );

    expect(netflixOption).toBeInTheDocument();

    // simulate keyboard navigation
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    // Optionally confirm that it selected `netflix`
    expect(input).toHaveValue("netflix");
  });

  it("clicks a suggestion", async () => {
    render(<SearchBar onSearch={onSearchMock} />);
    const input = screen.getByLabelText(/search transactions/i);

    fireEvent.change(input, { target: { value: "app" } });
    act(() => jest.advanceTimersByTime(300));

    // const listbox = screen.getByRole("listbox");

    const suggestionItems = screen.getAllByRole("option");
    const appleOption = suggestionItems.find((el) =>
      el.textContent?.trim().toLowerCase() === "apple"
    );

    expect(appleOption).toBeInTheDocument();
    fireEvent.click(appleOption!);
  });

  test("clears input and resets suggestions to history", () => {
    const onSearchMock = jest.fn();
    localStorage.setItem("searchHistory", JSON.stringify(["venmo", "uber"]));
    render(<SearchBar onSearch={onSearchMock} />);

    const input = screen.getByLabelText(/search transactions/i);
    fireEvent.change(input, { target: { value: "venmo" } });

    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearBtn);

    expect(input).toHaveValue("");
    expect(onSearchMock).toHaveBeenLastCalledWith("");

    // History should now be shown
    expect(screen.getByText(/venmo/i)).toBeInTheDocument();
  });

  test("limits search term length and sanitizes input", () => {
  render(<SearchBar onSearch={jest.fn()} />);
  
  const input = screen.getByLabelText(/search transactions/i);
  
  const longUnsafe = "<script>alert('x')</script>".repeat(10); // > 100 chars
  
  fireEvent.change(input, { target: { value: longUnsafe } });

  const value = (input as HTMLInputElement).value;

  // Should not contain script tags
  expect(value).not.toMatch(/[<>{}]/);
  expect(value.length).toBeLessThanOrEqual(100);
});
});
