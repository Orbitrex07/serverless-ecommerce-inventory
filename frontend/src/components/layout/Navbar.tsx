import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, ArrowRight, Layers, FileText, CheckCircle } from 'lucide-react';

interface NavbarProps {
  onSearchChange?: (term: string) => void;
  searchValue?: string;
  totalProductsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchChange,
  searchValue = '',
  totalProductsCount = 5
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E6DF] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#121316] flex items-center justify-center text-white shadow-sm group-hover:bg-[#0055FF] transition-colors">
                <span className="font-extrabold tracking-tighter text-lg font-mono">N</span>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-[#121316] block uppercase">
                  NEXORA
                </span>
                <span className="text-[10px] font-mono tracking-widest text-[#7C7E8A] uppercase block -mt-1">
                  Serverless Gear
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/"
                className={`transition-colors py-1 ${
                  isActive('/') ? 'text-[#0055FF] font-semibold' : 'text-[#50525C] hover:text-[#121316]'
                }`}
              >
                Storefront
              </Link>
              <Link
                to="/orders"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  isActive('/orders') ? 'text-[#0055FF] font-semibold' : 'text-[#50525C] hover:text-[#121316]'
                }`}
              >
                Track Order
              </Link>
              <Link
                to="/architecture"
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  isActive('/architecture') ? 'text-[#0055FF] font-semibold' : 'text-[#50525C] hover:text-[#121316]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#0055FF]" />
                AWS Architecture
              </Link>
            </nav>
          </div>

          {/* Search bar & Live Stock indicator */}
          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-8">
            {onSearchChange && (
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8C96]" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search live catalogue (e.g. 4K, headphones, mechanical)..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-[#DCDAD2] bg-white text-xs text-[#121316] placeholder:text-[#9A9CA6] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] transition-all"
                />
              </div>
            )}
          </div>

          {/* Actions: Live AWS Badge & Order Lookup CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ap-south-1 Live</span>
            </div>

            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121316] hover:bg-black text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Lookup Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#DCDAD2] text-[#121316] hover:bg-[#F0EFEA] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search if passed */}
        {onSearchChange && (
          <div className="pb-3 lg:hidden">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8C96]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#DCDAD2] bg-white text-xs text-[#121316] placeholder:text-[#9A9CA6] focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E6DF] bg-white px-4 pt-4 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/') ? 'bg-[#F2F1EB] text-[#0055FF] font-bold' : 'text-[#121316]'
            }`}
          >
            Storefront
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/orders') ? 'bg-[#F2F1EB] text-[#0055FF] font-bold' : 'text-[#121316]'
            }`}
          >
            Track Order Status
          </Link>
          <Link
            to="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/architecture') ? 'bg-[#F2F1EB] text-[#0055FF] font-bold' : 'text-[#121316]'
            }`}
          >
            AWS Serverless Architecture
          </Link>
          <div className="pt-2 border-t border-[#F2F1EB] flex items-center justify-between text-xs font-mono text-[#7B7D88]">
            <span>AWS Region: ap-south-1</span>
            <span className="text-emerald-700 font-semibold">• Live API Connected</span>
          </div>
        </div>
      )}
    </header>
  );
};
