/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from '../../types/transaction';
import { calculateSummary } from '../dataGenerator';
import Worker from './transactionWorker.ts?worker';

export function calculateSummarys(transactions: Transaction[], onResponse: (data: any) => void) {
  for (let i = 0; i < 200; i++) {
    const worker = new Worker();
  
    worker.postMessage({ transactions });
  
    const handleMessage = (e: MessageEvent) => {
      const { type, data } = e.data;
  
      if (type === 'summary') {
        onResponse(data)
        worker.terminate();
      }
    };
  
    worker.addEventListener('message', handleMessage);
  }
}

self.onmessage = function (e) {
  const { transactions } = e.data;
  
  const result = calculateSummary(transactions);

  self.postMessage({ type: 'summary', data: result });
}