import React, { useState } from 'react';
import type { Product, CreateOrderResponse } from '../../types';
import { postOrder, ApiException } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getProductMetadata } from '../../utils/productData';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, ShieldAlert, ArrowRight, Minus, Plus, AlertCircle, Info, Lock } from 'lucide-react';

interface CheckoutModalProps {
  product: Product | null;
  initialQuantity?: number;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderResponse: CreateOrderResponse) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  initialQuantity = 1,
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  if (!isOpen || !product) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [quantity, setQuantity] = useState(
    Math.min(Math.max(1, initialQuantity), Math.max(1, product.stockQuantity))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    customerName?: string;
    customerEmail?: string;
    quantity?: string;
  }>({});

  const meta = getProductMetadata(product.productId, product.productName);
  const totalAmount = product.price * quantity;
  const isOutOfStock = product.stockQuantity <= 0;

  const validate = (): boolean => {
    const errors: { customerName?: string; customerEmail?: string; quantity?: string } = {};

    if (!customerName.trim()) {
      errors.customerName = 'Please enter your full name.';
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!customerEmail.trim()) {
      errors.customerEmail = 'Please provide an email address for order notifications.';
    } else if (!emailRegex.test(customerEmail.trim())) {
      errors.customerEmail = 'Please enter a valid email format (e.g., alex@example.com).';
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = 'Quantity must be a positive whole number.';
    } else if (quantity > product.stockQuantity) {
      errors.quantity = `Requested quantity exceeds available stock (${product.stockQuantity}).`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        productId: product.productId,
        quantity: quantity
      };

      const result = await postOrder(orderPayload);
      setIsSubmitting(false);
      onOrderSuccess(result);
    } catch (err: any) {
      setIsSubmitting(false);
      if (err instanceof ApiException) {
        if (err.statusCode === 409) {
          setErrorMessage(
            `Inventory Conflict: ${err.message || 'Requested quantity is no longer available in DynamoDB.'}`
          );
        } else if (err.statusCode === 404) {
          setErrorMessage(`Product Error: Product ${product.productId} was not found in the AWS catalogue.`);
        } else if (err.statusCode === 400) {
          setErrorMessage(`Validation Error: ${err.message}`);
        } else {
          setErrorMessage(`Server Error (${err.statusCode}): ${err.message}`);
        }
      } else {
        setErrorMessage(
          'Network Error: Unable to complete your order request. Please verify your connection.'
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#121316]/70 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E5E4DE] overflow-hidden z-10 my-6 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EFEFE9]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#0055FF] font-semibold">
              Checkout
            </span>
            <h3 className="text-xl font-bold text-[#121316] tracking-tight">
              Review & Place Order
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#888A93] hover:text-[#121316] hover:bg-[#F2F1EC] rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Selected Product Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EBE8E0] flex items-center gap-4">
            <img
              src={meta.primaryImage}
              alt={product.productName}
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E0DED5]"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-[#8C8E98] uppercase block">
                {product.productId}
              </span>
              <h4 className="text-sm font-bold text-[#121316] truncate">
                {product.productName}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#5D5F6A]">
                <span>Unit: {formatCurrency(product.price)}</span>
                <span>•</span>
                <span className="font-mono text-emerald-700 font-medium">
                  {product.stockQuantity} in stock
                </span>
              </div>
            </div>
          </div>

          {/* Academic Demo Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#0055FF] shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong className="font-semibold">Academic Demonstration Notice:</strong> This project is connected to a live AWS Serverless backend (Lambda + DynamoDB TransactWriteItems). Orders are registered directly into DynamoDB without processing actual credit card payments.
            </div>
          </div>

          {/* Global Submission Error */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-900 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Order Failed</strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Checkout Form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Name */}
            <div>
              <label
                htmlFor="customerName"
                className="block text-xs font-semibold uppercase tracking-wider text-[#4E5059] mb-1.5"
              >
                Customer Full Name *
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.customerName) {
                    setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
                  }
                }}
                disabled={isSubmitting}
                placeholder="e.g. Aarav Sharma"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#121316] bg-white transition-all outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] ${
                  fieldErrors.customerName ? 'border-red-400 bg-red-50/20' : 'border-[#D5D3CC]'
                }`}
              />
              {fieldErrors.customerName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.customerName}
                </p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label
                htmlFor="customerEmail"
                className="block text-xs font-semibold uppercase tracking-wider text-[#4E5059] mb-1.5"
              >
                Notification Email *
              </label>
              <input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (fieldErrors.customerEmail) {
                    setFieldErrors((prev) => ({ ...prev, customerEmail: undefined }));
                  }
                }}
                disabled={isSubmitting}
                placeholder="e.g. aarav@example.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#121316] bg-white transition-all outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] ${
                  fieldErrors.customerEmail ? 'border-red-400 bg-red-50/20' : 'border-[#D5D3CC]'
                }`}
              />
              <span className="text-[11px] text-[#7D7F8A] mt-1 block">
                The SNS alert topic will trigger an event on successful DynamoDB stream capture.
              </span>
              {fieldErrors.customerEmail && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.customerEmail}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4E5059] mb-1.5">
                Quantity (Max {product.stockQuantity})
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#D5D3CC] rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isSubmitting || quantity <= 1}
                    className="p-2.5 hover:bg-[#F2F1EB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4 text-[#121316]" />
                  </button>
                  <span className="w-12 text-center font-mono font-semibold text-sm text-[#121316]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    disabled={isSubmitting || quantity >= product.stockQuantity}
                    className="p-2.5 hover:bg-[#F2F1EB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4 text-[#121316]" />
                  </button>
                </div>
                <span className="text-xs text-[#7A7C87]">
                  Unit: {formatCurrency(product.price)}
                </span>
              </div>
              {fieldErrors.quantity && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.quantity}
                </p>
              )}
            </div>

            {/* Order Cost Breakdown */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#EAE8E0] space-y-2 pt-3">
              <div className="flex justify-between text-xs text-[#6B6D78]">
                <span>Items Subtotal ({quantity}x)</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#6B6D78]">
                <span>Estimated Standard Shipping</span>
                <span className="text-emerald-700 font-medium">Free (Demo)</span>
              </div>
              <div className="border-t border-[#E5E3DC] pt-2 flex justify-between items-baseline font-bold text-sm text-[#121316]">
                <span>Total Calculated Amount</span>
                <span className="text-lg font-mono text-[#0055FF]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-[#EFEFE9] bg-[#FAF9F5] flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="checkout-form"
            variant="secondary"
            size="md"
            isLoading={isSubmitting}
            disabled={isSubmitting || isOutOfStock}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="flex-1 font-semibold shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? 'Atomically Reserving...' : `Confirm Order — ${formatCurrency(totalAmount)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
