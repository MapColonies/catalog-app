export interface WorkerAPI {
  calculateArea(
    data: number[],
    onProgress?: (p: number) => void
  ): number[];

  fetchAndDouble(): Promise<number[]>;
}