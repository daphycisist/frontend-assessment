/// <reference lib="webworker" />

import { generateRiskAssessment } from '../utils/analyticsEngine';
import type { Transaction } from '../types/transaction';

self.onmessage = (event: MessageEvent<Transaction[]>) => {
  const data = event.data;
  // only analyse first 1000 transactions
  const slice = data.slice(0, 1000);
  const result = generateRiskAssessment(slice);
  self.postMessage(result);
};
