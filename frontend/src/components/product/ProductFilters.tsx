import React from 'react';
import { Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalFilteredCount: number;
  totalCatalogueCount: number;
  onResetFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  totalFilteredCount,
  totalCatalogueCount,
  onResetFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-8 border-b border-[#E8E6DF]">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-none">
        <button
          onClick={() => onSelectCategory('All')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-[#121316] text-white shadow-xs'
              : 'bg-white text-[#52545F] hover:bg-[#EFEFEA] border border-[#E5E4DE]'
          }`}
        >
          All Items ({totalCatalogueCount})
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#121316] text-white shadow-xs'
                : 'bg-white text-[#52545F] hover:bg-[#EFEFEA] border border-[#E5E4DE]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sorting Control & Reset */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7B7D88] hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#DCDAD2] bg-white text-xs font-medium text-[#121316] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] cursor-pointer"
          >
            <option value="featured">Featured (Catalogue Order)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Product Name (A-Z)</option>
            <option value="stock-desc">Stock Availability</option>
          </select>
        </div>

        {(selectedCategory !== 'All' || sortBy !== 'featured') && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-[#8A8C96] hover:text-[#121316] cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
