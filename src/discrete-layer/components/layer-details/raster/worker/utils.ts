import { MessageDetails, WorkerError, WorkerMessage } from './worker.types';

const calculatePercentage = (total: number | null | undefined, partial: number): number => {
  if (total !== null && total !== undefined && total > 0) {
    return Math.floor((partial / total) * 100);
  } else {
    return 0;
  }
};

const getElapsedTime = (performanceStartTime: number) => {
  return Math.floor(performance.now() - performanceStartTime);
};

export const createMessageDetails = (
  total: number | null | undefined,
  partial: number,
  performanceStartTime: number,
  error?: WorkerError
) => {
  const percent = calculatePercentage(total, partial);
  return buildMessageDetails(percent.toString(), performanceStartTime, error);
};

export const buildMessageDetails = (
  percent: string,
  performanceStartTime: number,
  error?: WorkerError
): MessageDetails => ({
  progress: `${percent}%`,
  elapsedTime: getElapsedTime(performanceStartTime),
  error,
});

export const extractProgressArray = (api: any): WorkerMessage[] => {
  if (!api) {
    return [];
  }

  return Object.values(api)
    .flatMap((proc: any) => {
      const progress = proc?.progress;
      if (!progress) {
        return [];
      }
      return Array.isArray(progress) ? progress : [progress];
    })
    .filter((p): p is WorkerMessage => p != null);
};
