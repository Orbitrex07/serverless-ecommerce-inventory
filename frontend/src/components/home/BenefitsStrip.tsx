import React from 'react';
import { Database, Zap, Shield, Mail, RotateCcw, Clock } from 'lucide-react';

export const BenefitsStrip: React.FC = () => {
  const benefits = [
    {
      icon: <Database className="w-5 h-5 text-[#0055FF]" />,
      title: 'Atomic Inventory Locks',
      description: 'Stock is checked and decremented atomically via DynamoDB TransactWriteItems to prevent race conditions.'
    },
    {
      icon: <Zap className="w-5 h-5 text-[#0055FF]" />,
      title: 'Sub-Second Latency',
      description: 'AWS Lambda Python 3.12 microservices running on the HTTP API v2 payload format for near-instant responses.'
    },
    {
      icon: <Mail className="w-5 h-5 text-[#0055FF]" />,
      title: 'Event-Driven SNS Alerts',
      description: 'DynamoDB Streams capture every confirmed order asynchronously and fan out email alerts via Amazon SNS.'
    },
    {
      icon: <Shield className="w-5 h-5 text-[#0055FF]" />,
      title: 'Transparent Pricing',
      description: 'Zero hidden fees. Prices and calculations are verified server-side on AWS before any order record is created.'
    }
  ];

  return (
    <section className="py-12 bg-[#F6F5EF] border-b border-[#E8E6DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/70 border border-[#E8E6DF] transition-all hover:bg-white hover:shadow-xs"
            >
              <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100/60 shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#121316] tracking-tight mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-[#5D5F6B] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
