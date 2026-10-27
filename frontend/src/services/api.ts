import type {
  Product,
  ProductsResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderSummary,
  ApiError
} from '../types';

const DEFAULT_API_BASE_URL = 'https://elkm5j4nyg.execute-api.ap-south-1.amazonaws.com/prod';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiException extends Error {
  public statusCode: number;
  public errorType: string;

  constructor(message: string, statusCode: number, errorType: string = 'ApiError') {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errorType = errorType;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If a caller provided a signal, link it to our controller
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    // Parse response body safely
    let responseData: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      let errorMessage = `Server returned status ${response.status}`;
      let errorType = 'HttpError';

      if (responseData && typeof responseData === 'object') {
        const apiErr = responseData as ApiError;
        errorMessage = apiErr.message || apiErr.error || errorMessage;
        errorType = apiErr.error || errorType;
      } else if (typeof responseData === 'string' && responseData.trim()) {
        errorMessage = responseData;
      }

      throw new ApiException(errorMessage, response.status, errorType);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiException) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ApiException('The network request timed out. Please check your connection and try again.', 408, 'TimeoutError');
    }
    throw new ApiException(
      err.message || 'Unable to connect to the AWS Serverless API. Please check your network.',
      0,
      'NetworkError'
    );
  }
}

/**
 * GET /products — Fetch all available products with live stock
 */
export async function getProducts(signal?: AbortSignal): Promise<ProductsResponse> {
  return request<ProductsResponse>('/products', { method: 'GET', signal });
}

/**
 * POST /orders — Submit an order for 1 product with atomic DynamoDB verification
 */
export async function postOrder(
  order: CreateOrderRequest,
  signal?: AbortSignal
): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
    signal
  });
}

/**
 * GET /orders/{orderId} — Fetch non-sensitive order summary
 */
export async function getOrder(
  orderId: string,
  signal?: AbortSignal
): Promise<OrderSummary> {
  const sanitizedId = encodeURIComponent(orderId.trim());
  return request<OrderSummary>(`/orders/${sanitizedId}`, { method: 'GET', signal });
}
