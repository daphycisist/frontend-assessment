/* eslint-disable @typescript-eslint/no-explicit-any */
// Dashboard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "../components/Dashboard";
import * as dataGenerator from "../utils/dataGenerator";

jest.mock("../utils/dataGenerator");

describe("Dashboard with SearchBar", () => {
  const mockTransactions = [
    {
      id: "txn_1",
      timestamp: new Date(),
      amount: 100,
      currency: "USD",
      type: "credit" as any,
      category: "Shopping",
      description: "Purchase at Amazon",
      merchantName: "Amazon",
      status: "completed" as any,
      userId: "user_1",
      accountId: "acc_1",
      location: "Tokyo, JP",
      reference: "REF2237854",
    },
  ];

  beforeEach(() => {
    jest.spyOn(dataGenerator, "generateTransactionData").mockResolvedValue(mockTransactions);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("filters transactions based on search term", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Total Transactions")).toBeInTheDocument());

    const input = screen.getByLabelText("Search transactions");
    await user.type(input, "amazon");
    jest.advanceTimersByTime(300);
    await waitFor(() => {
      expect(screen.getByText("Purchase at Amazon")).toBeInTheDocument();
    });

    // Test keyboard navigation
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(input).toHaveValue("amazon");
    });
  });
});