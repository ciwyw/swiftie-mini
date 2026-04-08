const DEFAULT_API_BASE_URL = 'https://swiftie-mini-server.ciwywi9649.workers.dev';

let apiBaseUrl = DEFAULT_API_BASE_URL;

export class ApiRequestError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
  }
}

interface ApiEnvelope<T> {
  code: number;
  data: T;
}

export function setApiBaseUrlForTesting(url: string) {
  apiBaseUrl = url.replace(/\/$/, '');
}

export function resetApiBaseUrlForTesting() {
  apiBaseUrl = DEFAULT_API_BASE_URL;
}

export function request<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${apiBaseUrl}${normalizedPath}`;
  const requester = wx as typeof wx & {
    request: (options: {
      url: string;
      method?: string;
      timeout?: number;
      success: (response: { statusCode: number; data: unknown }) => void;
      fail: (error: { errMsg?: string }) => void;
    }) => void;
  };

  return new Promise<T>((resolve, reject) => {
    requester.request({
      url,
      method: 'GET',
      timeout: 8000,
      success: (response: { statusCode: number; data: unknown }) => {
        const statusCode = response.statusCode;

        if (statusCode >= 200 && statusCode < 300) {
          const payload = response.data as ApiEnvelope<T>;

          if (payload?.code === 0) {
            resolve(payload.data);
            return;
          }

          reject(new ApiRequestError('API returned an error envelope', statusCode));
          return;
        }

        reject(new ApiRequestError(`Request failed with status ${statusCode}`, statusCode));
      },
      fail: (error: { errMsg?: string }) => {
        const message =
          typeof error?.errMsg === 'string' && error.errMsg.length > 0
            ? error.errMsg
            : 'Request failed';
        reject(new ApiRequestError(message));
      }
    });
  });
}
