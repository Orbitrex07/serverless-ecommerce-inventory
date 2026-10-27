import React, { useState } from 'react';
import type { CreateOrderResponse } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface OrderSuccessModalProps {
  order: CreateOrderResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrderLookup: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrderLookup
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E4DE] overflow-hidden z-10 my-6 animate-scaleUp">
        {/* Success Icon & Header */}
        <div className="p-8 text-center bg-gradient-to-b from-[#F2F8FD] to-white border-b border-[#EFEFE9]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100/90 text-emerald-600 mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9 stroke-[2]" />
          </div>

          <Badge variant="success" size="md" className="mb-2">
            Status: {order.status || 'CONFIRMED'}
          </Badge>

          <h3 className="text-2xl font-extrabold text-[#121316] tracking-tight">
            Order Successfully Placed!
          </h3>

          <p className="mt-1.5 text-xs sm:text-sm text-[#5D5F6B] max-w-sm mx-auto leading-relaxed">
            Your inventory reservation was committed via DynamoDB TransactWriteItems and dispatched to the event stream.
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Order ID Box with Copy Button */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EBE8E0]">
            <div className="flex items-center justify-between text-xs text-[#8A8C96] mb-1">
              <span className="font-mono uppercase tracking-wider">DynamoDB Order Identifier</span>
              <button
                onClick={handleCopyOrderId}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0055FF] hover:text-[#0042C9] cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-base font-bold text-[#121316] tracking-wide select-all break-all">
              {order.orderId}
            </div>
          </div>

          {/* Item & Financial Breakdown */}
          <div className="divide-y divide-[#EFEFE9] text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#646672]">Product Ordered</span>
              <span className="font-semibold text-[#121316] text-right truncate max-w-[240px]">
                {order.productName}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#646672]">Product ID</span>
              <span className="font-mono text-[#121316]">{order.productId}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#646672]">Quantity</span>
              <span className="font-mono font-semibold text-[#121316]">{order.quantity}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#646672]">Unit Price</span>
              <span className="font-mono text-[#121316]">{formatCurrency(order.unitPrice)}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#646672]">Timestamp</span>
              <span className="font-mono text-[11px] text-[#646672]">{formatDate(order.createdAt)}</span>
            </div>
            <div className="py-3 flex justify-between items-baseline font-bold text-sm text-[#121316] bg-[#FAF9F5] px-3 rounded-lg mt-2">
              <span>Total Recorded Amount</span>
              <span className="text-base font-mono text-[#0055FF]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Serverless event explanation note */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-2.5 text-[11px] text-[#555760] leading-relaxed">
            <Cpu className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
            <div>
              <strong>Event pipeline active:</strong> The DynamoDB Stream detected this record insertion, triggering the asynchronous Lambda notification service which dispatches an SNS email to the administrator.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-[#EFEFE9] bg-[#FAF9F5] flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => onViewOrderLookup(order.orderId)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-1/2 text-xs font-semibold"
          >
            Track in Lookup
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            leftIcon={<ShoppingBag className="w-4 h-4" />}
            className="w-full sm:w-1/2 text-xs font-semibold"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};
