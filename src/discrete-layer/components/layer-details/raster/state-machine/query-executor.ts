import { buildError } from './helpers';

export async function queryExecutor<T>(queryWrapper: () => Promise<T>): Promise<T> {
  try {
    return await queryWrapper();
  } catch (e: any) {
    if (e?.response) {
      throw e;
    } else {
      const message = e?.response?.data?.message || e?.message || 'Unknown error';
      throw buildError('general.server.unavailable', message, 'api');
    }
  }
}