const DEFAULT_TIMEOUT = 5000;

export const abortableFetch = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response;
  } catch (err) {
    throw err;
  }
};

export async function safeRead(
  reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>
): Promise<ReadableStreamReadResult<Uint8Array<ArrayBuffer>>> {
  const result = await Promise.race<ReadableStreamReadResult<Uint8Array<ArrayBuffer>>>([
    reader.read(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Stalled connection')), DEFAULT_TIMEOUT)
    ),
  ]);

  return result;
}
