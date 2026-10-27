import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#0055FF] font-semibold">
            Error 404
          </span>
          <h1 className="text-4xl font-extrabold text-[#121316] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-[#666874] leading-relaxed">
            The page you are looking for doesn't exist or has been relocated within the storefront.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                Return to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
