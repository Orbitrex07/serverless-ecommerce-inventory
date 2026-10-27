import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, getProducts } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Layers,
  Cloud,
  Cpu,
  Database,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity,
  ArrowRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'healthy' | 'error'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);

  const runHealthCheck = async () => {
    setPingStatus('checking');
    const start = performance.now();
    try {
      const resp = await getProducts();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setItemCount(resp.count || resp.products?.length || 0);
      setPingStatus('healthy');
    } catch {
      setPingStatus('error');
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666874] hover:text-[#121316] mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0055FF] text-xs font-mono font-medium border border-blue-200/60 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>AWS SERVERLESS ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#121316] tracking-tight">
            System Design & Cloud Architecture
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#595B67] leading-relaxed">
            Detailed walkthrough of the serverless event-driven architecture powering NEXORA. Designed for high availability, atomic consistency, and zero idle server costs.
          </p>
        </div>

        {/* Live Cloud Connection Diagnostic Card */}
        <div className="bg-[#121316] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#252833] mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#252833] gap-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 block">
                Target Backend Gateway
              </span>
              <div className="text-sm sm:text-base font-mono font-bold text-white break-all mt-1">
                {API_BASE_URL}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              isLoading={pingStatus === 'checking'}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#121316]" />}
              className="bg-white text-[#121316] text-xs"
            >
              Ping Endpoint
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div>
              <span className="text-xs text-[#828698] block">Connection Status</span>
              <div className="flex items-center gap-2 mt-1">
                {pingStatus === 'healthy' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-400">Online & Serving</span>
                  </>
                )}
                {pingStatus === 'checking' && (
                  <span className="text-sm font-medium text-amber-300">Measuring latency...</span>
                )}
                {pingStatus === 'error' && (
                  <span className="text-sm font-bold text-rose-400">Gateway Unreachable</span>
                )}
                {pingStatus === 'idle' && (
                  <span className="text-sm text-neutral-400">Idle</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-[#828698] block">Round-Trip Latency</span>
              <div className="text-sm font-mono font-bold text-white mt-1">
                {latencyMs !== null ? `${latencyMs} ms` : '—'}
              </div>
            </div>

            <div>
              <span className="text-xs text-[#828698] block">Live DynamoDB Items</span>
              <div className="text-sm font-mono font-bold text-white mt-1">
                {itemCount !== null ? `${itemCount} products available` : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Layers Breakdown */}
        <div className="space-y-8 mb-16">
          <h2 className="text-2xl font-extrabold text-[#121316] tracking-tight">
            Distributed Components Breakdown
          </h2>

          {/* Component 1: API Gateway */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-[#0055FF] border border-blue-100 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#121316]">
                    1. Amazon API Gateway (HTTP API v2)
                  </h3>
                  <Badge variant="accent">ap-south-1 (Mumbai)</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[#5D5F6A] leading-relaxed">
                  Acts as the unified entry point. Designed with native CORS headers, payload version 2.0 format, and low-latency route routing directly to AWS Lambda functions without EC2 instances or load balancers.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#F2F1EB] text-[#121316]">GET /products</span>
                  <span className="px-2 py-0.5 rounded bg-[#F2F1EB] text-[#121316]">POST /orders</span>
                  <span className="px-2 py-0.5 rounded bg-[#F2F1EB] text-[#121316]">GET /orders/&#123;orderId&#125;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Component 2: Lambda Functions */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#121316]">
                    2. AWS Lambda Handlers (Python 3.12)
                  </h3>
                  <Badge variant="default">Microservices</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[#5D5F6A] leading-relaxed">
                  Ephemeral compute layer running two specialized functions:
                </p>
                <ul className="text-xs text-[#5D5F6A] space-y-1.5 list-disc pl-5 pt-1">
                  <li>
                    <strong className="text-[#121316]">OrderApiFunction:</strong> Handles requests, enforces email format validation, retrieves canonical pricing from DynamoDB, checks stock thresholds, and invokes atomic writes.
                  </li>
                  <li>
                    <strong className="text-[#121316]">NotificationFunction:</strong> Triggered asynchronously by DynamoDB Streams when a new order record is committed, formulating and publishing SNS alert notifications.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Component 3: DynamoDB TransactWriteItems */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#121316]">
                    3. Amazon DynamoDB (ACID Transactions)
                  </h3>
                  <Badge variant="success">TransactWriteItems</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[#5D5F6A] leading-relaxed">
                  Guarantees that an order cannot be placed if the inventory has already been claimed by a concurrent buyer.
                </p>
                <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E0] text-xs font-mono text-[#3E4048] space-y-1 mt-2">
                  <div className="text-[#0055FF] font-semibold">// Atomic Transaction Invariant</div>
                  <div>Condition: attribute_exists(productId) AND stockQuantity &gt;= :requestedQty</div>
                  <div>Action 1: Update ProductsTable (stockQuantity = stockQuantity - :requestedQty)</div>
                  <div>Action 2: PutItem OrdersTable (status = CONFIRMED)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Component 4: Event-Driven Notifications */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E6DF] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#121316]">
                    4. DynamoDB Streams & Amazon SNS
                  </h3>
                  <Badge variant="warning">Event-Driven</Badge>
                </div>
                <p className="text-xs sm:text-sm text-[#5D5F6A] leading-relaxed">
                  Decouples notification dispatch from customer request latency. The user receives their HTTP 201 response immediately, while the stream events asynchronously publish email alerts to the registered administrator.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Project Presentation Tips */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#E5E3DC] mb-12">
          <div className="flex items-center gap-2.5 text-sm font-bold text-[#121316] mb-3">
            <Terminal className="w-4 h-4 text-[#0055FF]" />
            <span>Guide for College Project Evaluation & Viva</span>
          </div>
          <div className="text-xs sm:text-sm text-[#5D5F6A] leading-relaxed space-y-3">
            <p>
              When presenting this project to your professor or evaluator:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Demonstrate Live Catalog Fetch:</strong> Show how the storefront loads live stock levels directly from the deployed AWS DynamoDB table via <code className="font-mono bg-white px-1 py-0.5 rounded">GET /products</code>.
              </li>
              <li>
                <strong>Demonstrate Atomic Concurrency:</strong> Place an order on the storefront and observe the stock decrementing in real-time. Show that placing an order with quantity exceeding stock triggers a clean <code className="font-mono bg-white px-1 py-0.5 rounded">HTTP 409 Conflict</code> rejection.
              </li>
              <li>
                <strong>Demonstrate Asynchronous SNS Alert:</strong> Highlight that the order creation event in DynamoDB Streams invokes the Lambda Notification function, delivering an email to the admin email address without adding delay to the client checkout.
              </li>
              <li>
                <strong>Demonstrate Order Verification:</strong> Copy the generated order ID and look it up on the Track Order page to prove that the record exists authoritatively in AWS DynamoDB.
              </li>
            </ol>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
