# NEXORA Storefront — Frontend Application

A production-quality e-commerce storefront for the **Serverless E-Commerce Inventory & Order Processing System**, built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Lucide Icons**.

This frontend is designed as a standalone, client-side application that communicates with your live AWS Serverless backend running on AWS Lambda, Amazon API Gateway (HTTP API v2), and Amazon DynamoDB in `ap-south-1` (Mumbai).

---

## 🚀 Live Backend Integration

The storefront interfaces with the following live AWS endpoints:
- `GET /products` — Fetches current product catalogue with real-time stock levels.
- `POST /orders` — Places atomic single-item orders via DynamoDB `TransactWriteItems`.
- `GET /orders/{orderId}` — Looks up confirmed orders without exposing customer email addresses.

> [!WARNING]
> **Academic Demonstration & Security Notice:**
> The current API endpoints are unauthenticated to allow straightforward academic and viva demonstrations. This architecture should not be considered hardened for public production without attaching Amazon Cognito or an API Gateway Lambda authorizer.
>
> In addition, this application does not collect credit card details or process payments; order submissions register confirmed reservations directly within AWS DynamoDB.

---

## 📁 Project Architecture & Folder Structure

```
frontend/
├── public/
│   ├── favicon.svg             # Branded NEXORA vector icon
│   └── ...
├── src/
│   ├── assets/                 # Static visual assets
│   ├── components/
│   │   ├── checkout/           # Order placement & confirmation modals
│   │   │   ├── CheckoutModal.tsx
│   │   │   └── OrderSuccessModal.tsx
│   │   ├── common/             # Reusable UI primitives (Buttons, Badges, Modals, Skeletons)
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── home/               # Hero banner, feature highlights & architecture diagrams
│   │   │   ├── ArchitectureBanner.tsx
│   │   │   ├── BenefitsStrip.tsx
│   │   │   └── HeroSection.tsx
│   │   ├── layout/             # Responsive Navbar and Footers
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   └── product/            # Product cards, detail modals, filters & resilient image fallbacks
│   │       ├── ProductCard.tsx
│   │       ├── ProductDetailModal.tsx
│   │       ├── ProductFilters.tsx
│   │       └── ProductImage.tsx
│   ├── pages/                  # Page routes (Storefront, Order Lookup, Architecture, 404)
│   │   ├── ArchitecturePage.tsx
│   │   ├── HomePage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── OrderLookupPage.tsx
│   ├── services/
│   │   └── api.ts              # Typed AWS API client with AbortController & error handling
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces for API schemas & domain models
│   ├── utils/
│   │   ├── formatters.ts       # Currency, date, and stock status helpers
│   │   └── productData.ts      # Curated photography, technical specs & category mappings
│   ├── App.tsx                 # React Router routing table
│   ├── index.css               # Design system tokens & Tailwind CSS v4 styling
│   └── main.tsx                # React application entrypoint
├── .env                        # Local environment variables
├── .env.example                # Example environment configuration
├── package.json
├── tsconfig.json
├── vercel.json                 # SPA rewrites for Vercel deployment
└── vite.config.ts              # Vite & Tailwind configuration
```

---

## 💻 Local Setup on Windows

### Prerequisites
- **Node.js** (v18 or higher recommended; verified on Node.js v25)
- **npm** (v9 or higher)

### 1. Navigate to the Frontend Directory
Open PowerShell and navigate into the `frontend/` folder:
```powershell
cd C:\Users\anupd\Desktop\CAD\frontend
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Ensure `.env` contains:
```env
VITE_API_BASE_URL=https://elkm5j4nyg.execute-api.ap-south-1.amazonaws.com/prod
```

### 4. Start the Development Server
```powershell
npm run dev
```
Open your browser at `http://localhost:5173/` (or the port indicated in terminal).

### 5. Build for Production
To test TypeScript compilation and generate the optimized production bundle:
```powershell
npm run build
```
Production assets are generated in `frontend/dist/`.

---

## ☁️ Deploying to Vercel (Recommended)

Deploying NEXORA to Vercel is straightforward because the repository is configured for single-page application (SPA) routing with `frontend/vercel.json`.

### Option A: Via Vercel Web Dashboard (Simplest)
1. Push your repository changes to GitHub.
2. Log into your [Vercel Dashboard](https://vercel.com).
3. Click **Add New** &rarr; **Project**.
4. Import your GitHub repository: `serverless-ecommerce-inventory`.
5. In **Project Configuration**:
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Framework Preset**: *Vite* (auto-detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Under **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://elkm5j4nyg.execute-api.ap-south-1.amazonaws.com/prod`
7. Click **Deploy**.

### Option B: Via Vercel CLI
```powershell
cd C:\Users\anupd\Desktop\CAD\frontend
npm install -g vercel
vercel
```
Follow the CLI prompts, select `frontend` as the root, and set `VITE_API_BASE_URL`.

---

## 🎓 College Viva & Evaluation Demonstration Guide

When presenting this project to your examiner or evaluation panel:

1. **Demonstrate Decoupled Full-Stack Architecture:**
   - Explain that the frontend is a standalone React SPA communicating over HTTPS with AWS Serverless microservices.
   - Show [src/services/api.ts](file:///C:/Users/anupd/Desktop/CAD/frontend/src/services/api.ts) which cleanly wraps API Gateway HTTP calls without hardcoding credentials or business logic.

2. **Demonstrate Atomic Inventory Reservation:**
   - Open a product (e.g. `prod-105`), note its current stock quantity (e.g., 74).
   - Place an order for quantity 1 with your name and email.
   - Show the instant `OrderSuccessModal` with the generated DynamoDB Order ID (`ord-xxxxxxxxxxxx`).
   - Refresh the page and show that the stock quantity has decremented to 73 immediately.

3. **Demonstrate Concurrency Rejection (HTTP 409 Conflict):**
   - Attempt to place an order with a quantity higher than the available stock.
   - Point out that the frontend validation stops the request, or submit a request that fails gracefully with an explicit DynamoDB condition check rejection message.

4. **Demonstrate DynamoDB Order Lookup:**
   - Copy the generated order ID and navigate to the **Track Order** page (`/orders`).
   - Query the order ID to show that it retrieves the authoritative, non-sensitive summary directly from the DynamoDB `Orders` table.

5. **Demonstrate Live AWS Diagnostic:**
   - Open the **AWS Architecture** page (`/architecture`).
   - Click **Ping Endpoint** to display real-time latency (typically ~100-250ms) and live product count directly from the Mumbai cloud region.
