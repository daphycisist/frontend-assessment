import { Transaction } from '../../types/transaction';
import Worker from './transactionWorker.ts?worker';

export function generateTransactionData({
  total,
  chunkSize = 1000,
  onChunk,
  onDone,
  onProgress,
  signal,
}: {
  total: number;
  chunkSize?: number;
  onChunk: (chunk: Transaction[]) => void;
  onProgress: (percent: number) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  // for (let i = 0; i < 2; i++) {
    const worker = new Worker();
  
    worker.postMessage({ total, chunkSize});
  
    const handleMessage = (e: MessageEvent) => {
      const { type, data, progress } = e.data;
  
      if (type === 'chunk') {
        onChunk(data);
        onProgress(progress);
      } else if (type === 'done') {
        onDone();
        worker.terminate();
      }
    };
  
    worker.addEventListener('message', handleMessage);
  
    if (signal) {
      signal.addEventListener('abort', () => {
        worker.terminate();
      });
    }
  // }
}