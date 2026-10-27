export interface Product {
  productId: string;
  productName: string;
  price: number;
  stockQuantity: number;
}

export interface ProductsResponse {
  count: number;
  products: Product[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  productId: string;
  quantity: number;
}

export interface CreateOrderResponse {
  message: string;
  orderId: string;
  status: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface OrderSummary {
  orderId: string;
  status: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}

export interface ProductCuratedMeta {
  category: string;
  tagline: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  primaryImage: string;
  secondaryImage?: string;
  accentColor: string;
  badge?: string;
}
