import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Cpu, Database, Mail, Cloud, ShieldCheck } from 'lucide-react';

export const ArchitectureBanner: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'HTTP API Gateway',
      subtitle: 'ap-south-1 Mumbai',
      description: 'CORS-enabled v2 routes for GET /products and POST /orders with low overhead.',
      icon: <Cloud className="w-5 h-5 text-[#0055FF]" />
    },
    {
      num: '02',
      title: 'Order Lambda API',
      subtitle: 'Python 3.12 Runtime',
      description: 'Validates payload, checks stock thresholds, and orchestrates database transactions.',
      icon: <Cpu className="w-5 h-5 text-[#0055FF]" />
    },
    {
      num: '03',
      title: 'DynamoDB Transact',
      subtitle: 'Atomic Isolation',
      description: 'TransactWriteItems atomically updates Products stock and records the confirmed Order.',
      icon: <Database className="w-5 h-5 text-[#0055FF]" />
    },
    {
      num: '04',
      title: 'Streams & SNS',
      subtitle: 'Asynchronous Push',
      description: 'DynamoDB Stream triggers NotificationFunction to dispatch real-time email alerts.',
      icon: <Mail className="w-5 h-5 text-[#0055FF]" />
    }
  ];

  return (
    <section className="py-16 bg-[#121316] text-white border-b border-[#252830]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F222B] text-[11px] font-mono text-blue-400 border border-[#2F3442] mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>SERVERLESS ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Event-Driven Flow Behind Every Order
            </h2>
          </div>

          <Link
            to="/architecture"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>Interactive Architecture Spec</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4-Step Process Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#1A1C23] border border-[#282B36] relative flex flex-col justify-between hover:border-[#383C4C] transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-[#232734] border border-[#2F3445]">
                    {step.icon}
                  </div>
                  <span className="font-mono text-xs font-bold text-[#5A5E70]">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight mb-1">
                  {step.title}
                </h3>
                <span className="text-[11px] font-mono text-blue-400 block mb-2.5">
                  {step.subtitle}
                </span>
                <p className="text-xs text-[#9B9EAE] leading-relaxed">
                  {step.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#232734] border border-[#3A3F52] flex items-center justify-center text-[#7F8498]">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
