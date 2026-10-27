import React from 'react';
import { ArrowDown, ShoppingBag, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface HeroSectionProps {
  onExploreClick: () => void;
  onFeaturedClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onFeaturedClick
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-[#E8E6DF]">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-neutral-200/40 rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFEFEA] border border-[#DDDCD4] text-xs font-mono font-medium text-[#121316]">
              <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
              <span>NEXORA // 2026 RELEASE</span>
              <span className="text-[#888A94]">|</span>
              <span className="text-[#555760]">AWS Serverless Powered</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#121316] tracking-tight leading-[1.08]">
              Technology,{' '}
              <span className="relative inline-block">
                thoughtfully
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-[#0055FF]/20 -z-1 rounded-sm" />
              </span>{' '}
              chosen.
            </h1>

            {/* Subcopy */}
            <p className="text-base sm:text-lg text-[#555762] max-w-xl font-normal leading-relaxed">
              Curated precision hardware, studio-grade acoustics, and ergonomic workstations. Built on distributed AWS primitives with real-time atomic inventory consistency.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={onExploreClick}
                rightIcon={<ArrowDown className="w-4 h-4" />}
                className="shadow-md shadow-neutral-900/10 font-semibold"
              >
                Explore Live Catalogue
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onFeaturedClick}
                rightIcon={<ArrowRight className="w-4 h-4 text-[#0055FF]" />}
                className="font-medium"
              >
                Featured Gear
              </Button>
            </div>

            {/* Architecture Highlights Pill Row */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#EAE8E0] max-w-lg">
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold font-mono text-[#121316]">100%</span>
                <span className="text-xs text-[#7A7C88]">Atomic DynamoDB</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold font-mono text-[#0055FF]">0 ms</span>
                <span className="text-xs text-[#7A7C88]">Oversell Latency</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold font-mono text-[#121316]">Event</span>
                <span className="text-xs text-[#7A7C88]">SNS Driven Pipeline</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Product Card Container */}
              <div className="relative rounded-3xl overflow-hidden bg-[#121316] text-white p-6 sm:p-8 shadow-2xl shadow-neutral-950/20 border border-[#2B2F3B]">
                {/* Top Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-medium backdrop-blur-md">
                    Signature Flagship
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live in Stock
                  </span>
                </div>

                {/* Hero Product Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-[#232630] to-[#121316] mb-6 flex items-center justify-center p-4">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85"
                    alt="AuraFlow Headphones"
                    className="w-full h-full object-cover rounded-xl shadow-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121316]/70 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Specs Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      AuraFlow Active ANC
                    </h3>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#3B82F6] font-mono">
                      $149.99
                    </span>
                  </div>

                  <p className="text-xs text-[#9B9EAE] leading-relaxed">
                    Custom 40mm beryllium drivers with hybrid active noise isolation and real-time DynamoDB inventory verification.
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={onFeaturedClick}
                      className="w-full py-3 rounded-xl bg-white text-[#121316] hover:bg-[#F2F1EB] font-semibold text-xs tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#0055FF]" />
                      <span>Order This Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Architectural Badge */}
              <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#E5E4DE] hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0055FF]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#121316] block">ACID Transactions</span>
                  <span className="text-[11px] font-mono text-[#6A6C77]">DynamoDB TransactWrite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
