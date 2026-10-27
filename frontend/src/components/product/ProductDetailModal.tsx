import React, { useState } from 'react';
import type { Product } from '../../types';
import { getProductMetadata } from '../../utils/productData';
import { formatCurrency, getStockStatus } from '../../utils/formatters';
import { ProductImage } from './ProductImage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { X, Check, ShieldCheck, Zap, Truck, ShoppingBag, Minus, Plus } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onProceedToCheckout
}) => {
  const [selectedQty, setSelectedQty] = useState(1);

  if (!isOpen || !product) return null;

  const meta = getProductMetadata(product.productId, product.productName);
  const stock = getStockStatus(product.stockQuantity);
  const isOutOfStock = product.stockQuantity <= 0;
  const maxQty = Math.max(1, product.stockQuantity);

  const handleDecrease = () => {
    setSelectedQty((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setSelectedQty((prev) => Math.min(maxQty, prev + 1));
  };

  const handleOrder = () => {
    if (!isOutOfStock) {
      onProceedToCheckout(product, selectedQty);
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
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#E5E4DE] overflow-hidden z-10 my-6 max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-[#888A93] hover:text-[#121316] bg-white/80 hover:bg-[#F2F1EC] rounded-full backdrop-blur-md shadow-xs transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Product Visuals */}
            <div>
              <div className="relative rounded-2xl overflow-hidden border border-[#E8E6DF] bg-[#F7F6F2]">
                <ProductImage
                  src={meta.primaryImage}
                  alt={product.productName}
                  productId={product.productId}
                  aspectRatio="square"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {meta.badge && (
                    <Badge variant="default" className="bg-white/90 backdrop-blur-sm shadow-xs font-semibold">
                      {meta.badge}
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white/80 backdrop-blur-sm font-mono text-[11px]">
                    {product.productId}
                  </Badge>
                </div>
              </div>

              {/* AWS Serverless Assurance Banner */}
              <div className="mt-5 p-4 rounded-xl bg-[#FAF9F5] border border-[#EAE8E0] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#121316]">
                  <ShieldCheck className="w-4 h-4 text-[#0055FF]" />
                  <span>Real-Time Atomic DynamoDB Inventory</span>
                </div>
                <p className="text-xs text-[#6B6D77] leading-relaxed">
                  Every order executes an atomic DynamoDB transaction, ensuring stock is never double-allocated.
                </p>
              </div>
            </div>

            {/* Right Column: Information, Specs, Quantity & Checkout */}
            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase tracking-widest text-[#0055FF] font-semibold mb-1">
                {meta.category}
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#121316] tracking-tight leading-tight mb-2">
                {product.productName}
              </h2>

              <p className="text-sm text-[#5B5D67] mb-5 leading-relaxed font-normal">
                {meta.description}
              </p>

              {/* Price & Stock status */}
              <div className="flex items-baseline justify-between p-4 rounded-xl bg-[#F7F6F2] border border-[#EBE9E2] mb-6">
                <div>
                  <span className="text-xs font-mono text-[#7B7D88] uppercase block">Price</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#121316] tracking-tight">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-[#7B7D88] uppercase block">Availability</span>
                  <span
                    className={`inline-flex items-center text-xs font-mono font-medium px-3 py-1 rounded-full border mt-1 ${stock.badgeClass}`}
                  >
                    {stock.label}
                  </span>
                </div>
              </div>

              {/* Quantity Selector (Only if in stock) */}
              {!isOutOfStock ? (
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6D77] mb-2">
                    Quantity (Max {product.stockQuantity})
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#D5D3CC] rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={handleDecrease}
                        disabled={selectedQty <= 1}
                        className="p-2.5 hover:bg-[#F2F1EB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-[#121316]" />
                      </button>
                      <span className="w-12 text-center font-mono font-semibold text-sm text-[#121316]">
                        {selectedQty}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrease}
                        disabled={selectedQty >= product.stockQuantity}
                        className="p-2.5 hover:bg-[#F2F1EB] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-[#121316]" />
                      </button>
                    </div>

                    <div className="text-xs text-[#7B7D88]">
                      Total: <span className="font-bold text-[#121316] text-sm">{formatCurrency(product.price * selectedQty)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-800">
                  This item is currently out of stock in the DynamoDB Products table. Please check back later.
                </div>
              )}

              {/* Order Button */}
              <Button
                variant="secondary"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleOrder}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
                className="w-full text-base font-semibold shadow-lg shadow-blue-600/20 mb-6"
              >
                {isOutOfStock ? 'Currently Unavailable' : `Proceed to Order — ${formatCurrency(product.price * selectedQty)}`}
              </Button>

              {/* Key Highlights */}
              <div className="border-t border-[#EAE8E1] pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#121316] mb-3">
                  Highlights & Architecture
                </h4>
                <ul className="space-y-2 mb-6">
                  {meta.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start text-xs text-[#52545E] leading-relaxed">
                      <Check className="w-3.5 h-3.5 text-[#0055FF] mr-2 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                {/* Technical Specifications */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#121316] mb-3">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {meta.specs.map((spec, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#EAE8E0] flex flex-col"
                    >
                      <span className="text-[10px] font-mono uppercase text-[#888A94]">{spec.label}</span>
                      <span className="font-semibold text-[#121316] mt-0.5">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
