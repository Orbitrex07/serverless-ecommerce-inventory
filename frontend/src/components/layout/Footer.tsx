import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cloud, Terminal, Cpu, Database, Mail, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#121316] text-[#A2A4B0] border-t border-[#252830] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#232630]">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0055FF] flex items-center justify-center text-white font-mono font-bold text-base">
                N
              </div>
              <span className="text-xl font-black text-white tracking-tight uppercase">
                NEXORA
              </span>
            </div>
            <p className="text-xs text-[#878A97] leading-relaxed">
              Technology, thoughtfully chosen. High-performance developer hardware and ergonomic gear backed by an event-driven AWS Serverless architecture.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1F28] border border-[#2B2F3D] text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Cloud Stack Active
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              Explore Storefront
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Product Catalogue
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Order Status Lookup
                </Link>
              </li>
              <li>
                <Link to="/architecture" className="hover:text-white transition-colors">
                  Serverless Architecture Deep Dive
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: AWS Architecture Specs */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white mb-4">
              AWS Infrastructure
            </h4>
            <ul className="space-y-2.5 text-xs text-[#878A97]">
              <li className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-[#0055FF]" />
                <span>API Gateway (HTTP API v2)</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#0055FF]" />
                <span>AWS Lambda (Python 3.12)</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#0055FF]" />
                <span>Amazon DynamoDB (TransactWriteItems)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#0055FF]" />
                <span>DynamoDB Streams & Amazon SNS</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Academic Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Demonstration Notice
            </h4>
            <div className="p-3.5 rounded-xl bg-[#191C24] border border-[#272B36] text-[11px] leading-relaxed text-[#878A97]">
              <p className="mb-2">
                This application is an academic demonstration of distributed serverless inventory management.
              </p>
              <p>
                No financial transactions or credit card charges occur. Inventory reservations are executed atomically in AWS Mumbai (<code className="text-white font-mono">ap-south-1</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright and project info */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6E7D] gap-4">
          <div>
            © {new Date().getFullYear()} NEXORA Hardware. Built for Serverless E-Commerce Inventory & Order Processing System.
          </div>
          <div className="flex items-center gap-6">
            <span>Region: ap-south-1</span>
            <span>•</span>
            <span className="font-mono text-[#8C90A0]">Stack: SAM + React + TS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
