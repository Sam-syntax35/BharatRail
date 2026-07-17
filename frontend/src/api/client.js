import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Map to track and cancel duplicate pending requests
const pendingRequests = new Map();

const getRequestKey = (config) => {
  const { method, url, params, data } = config;
  return [
    method,
    url,
    params ? JSON.stringify(params) : '',
    data && typeof data === 'string' ? data : (data ? JSON.stringify(data) : '')
  ].join('&');
};

const addPendingRequest = (config) => {
  const requestKey = getRequestKey(config);
  
  // If request is already pending, abort the previous one to avoid race conditions
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller.abort();
    pendingRequests.delete(requestKey);
  }

  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(requestKey, controller);
};

const removePendingRequest = (config) => {
  const requestKey = getRequestKey(config);
  if (pendingRequests.has(requestKey)) {
    pendingRequests.delete(requestKey);
  }
};

// Request Interceptor
client.interceptors.request.use(
  (config) => {
    // Only cancel duplicates for GET requests or specific endpoints to avoid interrupting non-idempotent POSTs
    if (config.method === 'get' || config.url?.includes('autocomplete')) {
      addPendingRequest(config);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for handling token refresh and errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => {
    removePendingRequest(response.config);
    return response;
  },
  async (error) => {
    // Remove from pending list
    if (error.config) {
      removePendingRequest(error.config);
    }

    // Check if error was caused by AbortController
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('REQUEST_CANCELLED'));
    }

    const originalRequest = error.config;

    // Handle 401 Unauthorized errors and trigger Token Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => client(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send a request to rotate refresh token
        await axios.post(`${API_BASE}/users/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Dispatch custom global logout event so stores can clear local states
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Structure a standardized UI error object
    const status = error.response?.status || 500;
    const msg = error.response?.data?.message || error.response?.data?.error || error.message;
    const errCode = error.response?.data?.error || 'SERVER_ERROR';

    const enhancedError = new Error(msg);
    enhancedError.status = status;
    enhancedError.code = errCode;
    enhancedError.data = error.response?.data || null;

    return Promise.reject(enhancedError);
  }
);

export default client;
