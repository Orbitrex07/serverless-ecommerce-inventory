import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { OrderSummary } from '../types';
import { getOrder, ApiException } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import {
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  ShieldCheck,
  Hash
} from 'lucide-react';

export const OrderLookupPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [orderIdInput, setOrderIdInput] = useState(initialId);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrderDetails = async (id: string) => {
    if (!id.trim()) {
      setErrorMessage('Please enter an Order ID to search.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const result = await getOrder(id);
      setOrderSummary(result);
    } catch (err: any) {
      setOrderSummary(null);
      if (err instanceof ApiException) {
        if (err.statusCode === 404) {
          setErrorMessage(
            `Order '${id.trim()}' was not found in the Amazon DynamoDB Orders table.`
          );
        } else if (err.statusCode === 400) {
          setErrorMessage('Invalid order ID parameter supplied.');
        } else {
          setErrorMessage(`Server Error (${err.statusCode}): ${err.message}`);
        }
      } else {
        setErrorMessage(
          'Unable to reach the AWS backend. Please check your internet connection.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If URL has ?id=ord-xxx, load automatically
  useEffect(() => {
    if (initialId) {
      setOrderIdInput(initialId);
      fetchOrderDetails(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();
    if (cleanId) {
      setSearchParams({ id: cleanId });
      fetchOrderDetails(cleanId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666874] hover:text-[#121316] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0055FF] text-xs font-mono font-medium border border-blue-200/60 mb-2">
            <Hash className="w-3.5 h-3.5" />
            <span>DYNAMODB ORDERS TABLE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
            Order Status Lookup
          </h1>
          <p className="mt-2 text-sm text-[#5E606C] leading-relaxed">
            Query the deployed AWS HTTP API endpoint (<code className="font-mono text-xs bg-[#EFEFEA] px-1.5 py-0.5 rounded">GET /orders/&#123;orderId&#125;</code>) directly to retrieve authoritative DynamoDB records.
          </p>
        </div>

        {/* Search Input Card */}
        <div className="bg-white rounded-2xl border border-[#E8E6DF] p-6 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8C96]" />
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Enter Order ID (e.g. ord-a1b2c3d4e5f6)..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5D3CC] bg-[#FAF9F6] text-sm font-mono text-[#121316] placeholder:text-[#9A9CA6] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Search className="w-4 h-4" />}
              className="font-semibold shadow-xs"
            >
              Lookup Order
            </Button>
          </form>

          {/* Academic notice on security privacy */}
          <div className="mt-4 pt-4 border-t border-[#F2F1EB] flex items-start gap-2 text-xs text-[#7B7D88]">
            <ShieldCheck className="w-4 h-4 text-[#0055FF] shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection:</strong> In compliance with security best practices, the backend Lambda deliberately strips the customer email address from order summaries before returning the JSON payload.
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-[#E8E6DF] p-8 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
            <div className="pt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {/* Error / Not Found Message */}
        {!isLoading && errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center text-rose-900">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">Lookup Failed</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Found Order Summary */}
        {!isLoading && orderSummary && (
          <div className="bg-white rounded-3xl border border-[#E8E6DF] p-6 sm:p-8 shadow-sm space-y-6">
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EFEFE9] gap-4">
              <div>
                <span className="text-xs font-mono text-[#8C8E9A] uppercase tracking-wider block">
                  Authoritative Record
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-[#121316] tracking-tight mt-0.5">
                  {orderSummary.orderId}
                </h2>
              </div>
              <div>
                <Badge
                  variant={orderSummary.status === 'CONFIRMED' ? 'success' : 'default'}
                  size="md"
                  className="text-xs font-mono font-semibold"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Status: {orderSummary.status}</span>
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Info */}
              <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EAE8E0] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#7B7D88] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#0055FF]" />
                  Product Information
                </span>
                <h3 className="text-base font-bold text-[#121316]">
                  {orderSummary.productName}
                </h3>
                <div className="text-xs font-mono text-[#5E606C]">
                  Product ID: <span className="font-semibold text-[#121316]">{orderSummary.productId}</span>
                </div>
              </div>

              {/* Timestamp Info */}
              <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EAE8E0] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#7B7D88] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0055FF]" />
                  Creation Timestamp
                </span>
                <div className="text-sm font-semibold text-[#121316]">
                  {formatDate(orderSummary.createdAt)}
                </div>
                <div className="text-[11px] font-mono text-[#7B7D88]">
                  ISO 8601 UTC Timezone
                </div>
              </div>
            </div>

            {/* Financial & Quantity Table */}
            <div className="border border-[#EFEFE9] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-[#6A6C78] font-mono uppercase border-b border-[#EFEFE9]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Total Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFE9] text-[#121316]">
                  <tr>
                    <td className="px-4 py-3 font-mono font-bold text-sm">
                      {orderSummary.quantity}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {formatCurrency(orderSummary.unitPrice)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-base text-right text-[#0055FF]">
                      {formatCurrency(orderSummary.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-[#7B7D88]">
                DynamoDB Table: <span className="font-mono text-[#121316]">serverless-ecommerce-inventory-Orders</span>
              </p>
              <Link to="/">
                <Button variant="primary" size="sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Initial Empty State before searching */}
        {!isLoading && !hasSearched && (
          <div className="py-16 text-center text-[#7B7D88]">
            <HelpCircle className="w-10 h-10 mx-auto text-[#A5A7B2] mb-3" />
            <h3 className="text-sm font-bold text-[#121316] mb-1">
              Have an order identifier?
            </h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">
              When you submit an order, the system generates an ID formatted like <code className="font-mono bg-[#EFEFEA] px-1 py-0.5 rounded text-[#121316]">ord-349f57ec0d53</code>. Paste it above to verify its status in DynamoDB.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
