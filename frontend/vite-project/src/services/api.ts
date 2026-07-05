export const apiUrl = import.meta.env.VITE_API_URL as string;

export const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('token_expires_at');
};

export const redirectToLogin = () => {
  clearStoredSession();
  window.location.href = '/';
};

type AuthFetchOptions = RequestInit & {
  unauthorizedStatuses?: number[];
  onUnauthorized?: () => void;
};

const hasBody = (options: RequestInit) => options.body !== undefined && options.body !== null;

export const authFetch = async (input: RequestInfo | URL, options: AuthFetchOptions = {}) => {
  const { unauthorizedStatuses = [401], onUnauthorized, ...requestOptions } = options;
  const token = localStorage.getItem('token');

  if (!token) {
    onUnauthorized?.();
    throw new Error('Token not found');
  }

  const headers = new Headers(requestOptions.headers);
  if (!(requestOptions.body instanceof FormData) && hasBody(requestOptions) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, {
    ...requestOptions,
    headers,
  });

  if (unauthorizedStatuses.includes(response.status)) {
    onUnauthorized?.();
    throw new Error('Authentication failed');
  }

  return response;
};

export const jsonFetch = async <T>(input: RequestInfo | URL, options: AuthFetchOptions = {}) => {
  const response = await authFetch(input, options);
  return response.json() as Promise<T>;
};
