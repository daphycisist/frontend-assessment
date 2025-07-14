/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from "@testing-library/react";
import { Dashboard } from "../components/Dashboard";
import * as userContext from "../hooks/useUserContext";
import * as dataGenerator from "../utils/dataGenerator";
import * as analyticsEngine from "../utils/analyticsEngine";
import * as riskHooks from "../hooks/useRiskAnalytics";

// Mock dependencies
jest.mock("../components/SearchBar", () => ({ SearchBar: () => <div>SearchBar</div> }));
jest.mock("../components/TransactionFilters", () => ({ TransactionFilters: () => <div>Filters</div> }));
jest.mock("../components/TransactionList", () => ({ TransactionList: () => <div>TransactionList</div> }));
jest.mock("../components/TransactionView", () => ({ TransactionView: () => <div>TransactionView</div> }));
jest.mock("../components/ViewCard", () => ({ ViewCard: ({ name }: any) => <div>{name}</div> }));
jest.mock("../ui/PageLoader", () => ({ PageLoader: () => <div>Loading...</div> }));
jest.mock("../components/ErrorBoundary", () => ({ ErrorBoundary: ({ children }: any) => <>{children}</> }));

beforeEach(() => {
  window.requestIdleCallback = (cb: any) => cb();
});

describe("Dashboard", () => {
  const largeMockTransactions = Array.from({ length: 1001 }, (_, i) => ({
    id: `txn-${i}`,
    amount: 100 + i,
    type: i % 2 === 0 ? "credit" : "debit" as any,
    category: "shopping",
    description: "Test transaction",
    merchantName: "Test merchant",
    timestamp: new Date(),
    userId: "user1",
    currency: "USD",
    status: "completed" as any,
    accountId: "123",
  }));

  // const mockTransactions = [
  //   {
  //     id: "tx1",
  //     userId: "user1",
  //     currency: "USD",
  //     description: "Merchant",
  //     accountId: "123",
  //     amount: 100,
  //     category: "food",
  //     type: "credit" as any,
  //     merchantName: "Amazon",
  //     status: "completed" as any,
  //     timestamp: new Date()
  //   },
  // ];

  const mockContext = {
    globalSettings: { theme: "light", currency: "USD" },
    trackActivity: jest.fn(),
  };

  const runAdvancedAnalyticsMock = jest.fn();
  beforeEach(() => {
    jest.spyOn(userContext, "useUserContext").mockReturnValue(mockContext as any);
    jest.spyOn(dataGenerator, "generateTransactionDataAsync").mockImplementation(async (total, onProgress) => {
      onProgress(largeMockTransactions);
      return largeMockTransactions;
    });
    jest.spyOn(analyticsEngine, "generateRiskAssessment").mockReturnValue({
      fraudScores: [],
      timeSeriesData: {
        dailyData: {},
        movingAverages: [],
      },
      marketCorrelation: {},
      behaviorClusters: {},
      processingTime: 10,
      dataPoints: 1000,
    });
    jest.spyOn(riskHooks, "useRiskAnalytics").mockReturnValue({
      runAdvancedAnalytics: runAdvancedAnalyticsMock,
    });

    window.requestIdleCallback = (cb: any) => cb();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading screen initially", async () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders dashboard content after loading", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/fintech dashboard/i)).toBeInTheDocument();
    });
    expect(screen.getByText("SearchBar")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("TransactionList")).toBeInTheDocument();
    expect(screen.getByText("Total Amount")).toBeInTheDocument();
    expect(screen.getByText("Total Credits")).toBeInTheDocument();
    expect(screen.getByText("Total Debits")).toBeInTheDocument();
  });

  it("calls generateTransactionDataAsync on mount", async () => {
    const spy = jest.spyOn(dataGenerator, "generateTransactionDataAsync");
    render(<Dashboard />);
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it("calls risk assessment once data exceeds threshold", async () => {
    // const spy = jest.spyOn(analyticsEngine, "generateRiskAssessment");
    render(<Dashboard />);
    await waitFor(() => {
      expect(runAdvancedAnalyticsMock).toHaveBeenCalled();
    });
  });
});
