import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product, CreateOrderResponse } from '../types';
import { getProducts, ApiException } from '../services/api';
import { getProductMetadata } from '../utils/productData';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { BenefitsStrip } from '../components/home/BenefitsStrip';
import { ArchitectureBanner } from '../components/home/ArchitectureBanner';
import { ProductCard } from '../components/product/ProductCard';
import { ProductFilters } from '../components/product/ProductFilters';
import { ProductDetailModal } from '../components/product/ProductDetailModal';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { OrderSuccessModal } from '../components/checkout/OrderSuccessModal';
import { Skeleton } from '../components/common/Skeleton';
import { Button } from '../components/common/Button';
import { AlertCircle, RefreshCw, ShoppingBag, Sparkles, Server } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // State for products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  // Modals state
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutInitialQty, setCheckoutInitialQty] = useState(1);
  const [confirmedOrder, setConfirmedOrder] = useState<CreateOrderResponse | null>(null);

  // Fetch live products
  const loadProducts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (err: any) {
      if (err instanceof ApiException) {
        setFetchError(`API Error (${err.statusCode}): ${err.message}`);
      } else {
        setFetchError(
          'Failed to connect to the AWS Serverless backend. Please check your network connection or AWS API Gateway status.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Compute categories dynamically from active catalogue
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const meta = getProductMetadata(p.productId, p.productName);
      set.add(meta.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.productId.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter((p) => {
        const meta = getProductMetadata(p.productId, p.productName);
        return meta.category === selectedCategory;
      });
    }

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === 'stock-desc') {
      result.sort((a, b) => b.stockQuantity - a.stockQuantity);
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Handler for successful order placement
  const handleOrderSuccess = (order: CreateOrderResponse) => {
    setCheckoutProduct(null);
    setDetailProduct(null);
    setConfirmedOrder(order);

    // Refresh catalogue in background so available stock decrements accurately
    loadProducts();
  };

  const handleProceedToCheckout = (product: Product, quantity: number) => {
    setDetailProduct(null);
    setCheckoutProduct(product);
    setCheckoutInitialQty(quantity);
  };

  const scrollToCatalogue = () => {
    const el = document.getElementById('catalogue-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFeaturedOrder = () => {
    if (products.length > 0) {
      const featured = products[0];
      setCheckoutProduct(featured);
      setCheckoutInitialQty(1);
    } else {
      scrollToCatalogue();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      {/* Navigation */}
      <Navbar
        onSearchChange={setSearchTerm}
        searchValue={searchTerm}
        totalProductsCount={products.length}
      />

      {/* Hero Section */}
      <HeroSection
        onExploreClick={scrollToCatalogue}
        onFeaturedClick={handleFeaturedOrder}
      />

      {/* Benefits Strip */}
      <BenefitsStrip />

      {/* Main Catalogue Section */}
      <main id="catalogue-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0055FF] text-xs font-mono font-medium border border-blue-200/60 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIVE AWS INVENTORY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
              Curated Hardware Catalogue
            </h2>
            <p className="mt-1 text-sm text-[#636571]">
              Live items synced directly with Amazon DynamoDB in the Mumbai region (ap-south-1).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
            >
              Refresh Stock
            </Button>
          </div>
        </div>

        {/* Filters & Sorting */}
        <ProductFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalFilteredCount={filteredProducts.length}
          totalCatalogueCount={products.length}
          onResetFilters={() => {
            setSelectedCategory('All');
            setSortBy('featured');
            setSearchTerm('');
          }}
        />

        {/* Error State */}
        {fetchError && (
          <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center my-8 max-w-xl mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-rose-900 mb-1">
              Unable to Load Catalogue
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed mb-5">
              {fetchError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadProducts}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#E8E6DF] p-5 space-y-4"
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="pt-4 border-t border-[#F2F1EB] flex justify-between">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && filteredProducts.length === 0 && (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-[#888A93] mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#121316] mb-1">
              No matching products found
            </h3>
            <p className="text-xs text-[#6B6D78] leading-relaxed mb-6">
              We couldn't find any items matching your active search or category filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSortBy('featured');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !fetchError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                onSelect={(p) => setDetailProduct(p)}
                onOrderNow={(p) => {
                  setCheckoutProduct(p);
                  setCheckoutInitialQty(1);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Architecture Visual Banner */}
      <ArchitectureBanner />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <ProductDetailModal
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        product={checkoutProduct}
        initialQuantity={checkoutInitialQty}
        isOpen={Boolean(checkoutProduct)}
        onClose={() => setCheckoutProduct(null)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderSuccessModal
        order={confirmedOrder}
        isOpen={Boolean(confirmedOrder)}
        onClose={() => setConfirmedOrder(null)}
        onViewOrderLookup={(orderId) => {
          setConfirmedOrder(null);
          navigate(`/orders?id=${encodeURIComponent(orderId)}`);
        }}
      />
    </div>
  );
};
