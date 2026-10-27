import React from 'react';
import type { Product } from '../../types';
import { getProductMetadata } from '../../utils/productData';
import { formatCurrency, getStockStatus } from '../../utils/formatters';
import { ProductImage } from './ProductImage';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOrderNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onOrderNow
}) => {
  const meta = getProductMetadata(product.productId, product.productName);
  const stock = getStockStatus(product.stockQuantity);
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group relative bg-[#FFFFFF] rounded-2xl border border-[#E8E6DF] p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-neutral-900/5 hover:border-[#D0CECB]">
      {/* Top Image & Category */}
      <div>
        <div className="relative mb-4 cursor-pointer" onClick={() => onSelect(product)}>
          <ProductImage
            src={meta.primaryImage}
            alt={product.productName}
            productId={product.productId}
            aspectRatio="square"
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {meta.badge && (
              <Badge variant="default" className="bg-white/95 backdrop-blur-md shadow-xs text-[#121316] font-semibold">
                {meta.badge}
              </Badge>
            )}
          </div>

          {/* Stock Tag on Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`inline-flex items-center text-[11px] font-mono font-medium px-2.5 py-1 rounded-full border backdrop-blur-md shadow-xs ${stock.badgeClass}`}
            >
              {stock.label}
            </span>
          </div>
        </div>

        {/* Product Category & Model ID */}
        <div className="flex items-center justify-between text-xs text-[#8A8C96] mb-1.5">
          <span className="font-medium tracking-wide uppercase">{meta.category}</span>
          <span className="font-mono text-[11px] text-[#A2A4AD]">{product.productId}</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(product)}
          className="text-base sm:text-lg font-bold text-[#121316] tracking-tight leading-snug hover:text-[#0055FF] transition-colors cursor-pointer line-clamp-2 mb-2"
        >
          {product.productName}
        </h3>

        {/* Short Tagline */}
        <p className="text-xs sm:text-sm text-[#6A6C76] line-clamp-2 mb-4 leading-relaxed">
          {meta.tagline}
        </p>
      </div>

      {/* Bottom Price & Actions */}
      <div className="pt-4 border-t border-[#F2F1EB] mt-auto">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-[11px] font-mono text-[#8A8C96] block uppercase tracking-wider">Unit Price</span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#121316] tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>
          <button
            onClick={() => onSelect(product)}
            className="inline-flex items-center text-xs font-semibold text-[#0055FF] hover:text-[#0042C9] transition-colors gap-0.5 cursor-pointer"
          >
            Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(product)}
            className="w-full text-xs"
          >
            Quick View
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isOutOfStock}
            onClick={() => onOrderNow(product)}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            className="w-full text-xs"
          >
            {isOutOfStock ? 'Sold Out' : 'Order Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};
