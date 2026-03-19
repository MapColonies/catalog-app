import { expose } from 'comlink';
import { WorkerAPI } from './worker.types';

const api: WorkerAPI = {
  calculateArea(data: number[], onProgress?: (p: number) => void): number[] {
    return data.map((x, idx) => {
      onProgress?.((idx + 1) / data.length);
      return x * 2;
    });
  },
  async fetchAndDouble(): Promise<number[]> {
    // Example async work (could fetch data)
    const data = [1, 2, 3];
    return data.map(x => x * 2);
  },
};

expose(api);