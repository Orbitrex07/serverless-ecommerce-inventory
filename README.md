# Serverless E-Commerce Inventory and Order Processing System

A complete, production-grade, event-driven serverless application built with **AWS SAM (Serverless Application Model)**, **AWS Lambda (Python 3.12)**, **Amazon DynamoDB**, **Amazon API Gateway HTTP API**, and **Amazon SNS**.

Designed for high reliability, atomic inventory protection, and decoupled asynchronous alerting.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Mermaid Architecture Diagram](#mermaid-architecture-diagram)
3. [AWS Services & Rationale](#aws-services--rationale)
4. [Functional Specification](#functional-specification)
   - [Product Catalogue (`GET /products`)](#1-product-catalogue-get-products)
   - [Order Placement (`POST /orders`)](#2-order-placement-post-orders)
   - [Order Summary (`GET /orders/{orderId}`)](#3-order-summary-get-ordersorderid)
   - [Inventory Seeder Script](#4-inventory-seeder-script)
5. [DynamoDB Database Design](#dynamodb-database-design)
6. [Notification Architecture & Limitations](#notification-architecture--limitations)
7. [Prerequisites](#prerequisites)
8. [Local Development & Testing](#local-development--testing)
9. [AWS Deployment Guide](#aws-deployment-guide)
10. [Seeding the Product Catalogue](#seeding-the-product-catalogue)
11. [Postman & cURL Testing Guide](#postman--curl-testing-guide)
12. [Verification & Observability](#verification--observability)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Cleanup & Resource Teardown](#cleanup--resource-teardown)

---

## Architecture Overview

The system implements a decoupled, event-driven serverless architecture:

1. **Client / Postman** submits an HTTP request to **Amazon API Gateway HTTP API**.
2. **API Gateway** routes the request to the **Order API Lambda Function** (`src/order_api/app.py`).
3. For orders, the **Order API Lambda**:
   - Validates client request fields (email regex, quantity bounds, non-empty IDs).
   - Reads the latest unit price and inventory from the `Products` DynamoDB table (server-side calculation).
   - Atomically reserves inventory and inserts the new order using DynamoDB `TransactWriteItems`.
   - Returns a structured HTTP status code (201 Created, 400 Bad Request, 404 Not Found, 409 Conflict, or 500 Internal Server Error).
4. **DynamoDB Streams** captures new items inserted into the `Orders` table (`NEW_IMAGE`).
5. The **Notification Lambda Function** (`src/notifications/app.py`) is asynchronously invoked by the stream.
6. The Notification Lambda filters for `INSERT` records, extracts order details, and publishes an administrative alert to an **Amazon SNS Topic**.
7. **Amazon SNS** dispatches an email alert to the confirmed project administrator inbox.

---

## Mermaid Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Client & Testing Layer"]
        User["Client / Postman / cURL"]
    end

    subgraph APILayer["API Gateway (HTTP API v2)"]
        APIGW["Amazon API Gateway HTTP API<br/>(CORS Enabled, /products, /orders)"]
    end

    subgraph ComputeLayer["AWS Lambda (Python 3.12)"]
        OrderFn["Order API Lambda<br/><code>src/order_api/app.py</code><br/>- Validates Input<br/>- Server Price Calculation<br/>- TransactWriteItems"]
        NotifFn["Notification Lambda<br/><code>src/notifications/app.py</code><br/>- Filters INSERT events<br/>- Asynchronous Alerting"]
    end

    subgraph StorageLayer["Amazon DynamoDB (On-Demand / Pay-Per-Request)"]
        ProductsDB[("Products Table<br/>PK: productId<br/>Attributes: name, price, stockQuantity")]
        OrdersDB[("Orders Table<br/>PK: orderId<br/>Attributes: customer, status, totalAmount...<br/>Stream: NEW_IMAGE")]
    end

    subgraph MessagingLayer["Amazon SNS"]
        SNSTopic["SNS Topic<br/><code>OrderAlertsTopic</code>"]
        AdminInbox["Admin / Team Email<br/>(Configured via NotificationEmail)"]
    end

    %% Invocations and data flows
    User -->|1. GET /products<br/>2. POST /orders<br/>3. GET /orders/{id}| APIGW
    APIGW -->|Proxy HTTP Event| OrderFn
    OrderFn -->|Check Price & Stock| ProductsDB
    OrderFn -->|Atomic TransactWriteItems:<br/>Decrement Stock & Insert Order| ProductsDB
    OrderFn -->|Atomic TransactWriteItems| OrdersDB
    OrdersDB -.->|DynamoDB Stream (NEW_IMAGE)| NotifFn
    NotifFn -->|Publish Order Alert| SNSTopic
    SNSTopic -->|Email Notification| AdminInbox
```

---

## AWS Services & Rationale

| Service | Why It Is Used |
| :--- | :--- |
| **Amazon API Gateway HTTP API** | Low-latency, cost-effective serverless HTTP ingress with native CORS handling and automatic integration with AWS Lambda. |
| **AWS Lambda (Python 3.12)** | Zero-maintenance serverless compute that executes on-demand, automatically scaling with incoming traffic and incurring zero idle cost. |
| **Amazon DynamoDB** | Fully managed NoSQL key-value database configured with **On-Demand (Pay-Per-Request)** billing. Delivers single-digit millisecond latency and atomic multi-table transactions via `TransactWriteItems`. |
| **DynamoDB Streams** | Change-data-capture (CDC) mechanism that emits real-time streams of item modifications. Enables decoupled, asynchronous processing without slowing down synchronous HTTP order responses. |
| **Amazon SNS (Simple Notification Service)** | Fully managed pub/sub messaging engine used for reliable fan-out and dispatching email notifications to project stakeholders. |
| **AWS SAM & CloudFormation** | Infrastructure-as-Code (IaC) tool for repeatable, version-controlled deployments with automated IAM least-privilege scoping. |
| **Amazon CloudWatch** | Centralized structured logging and performance metrics for both Lambda functions and API Gateway. |

---

## Functional Specification

### 1. Product Catalogue (`GET /products`)
- **Description:** Scans the DynamoDB `Products` table and returns available products.
- **Response Format:**
  ```json
  {
    "count": 3,
    "products": [
      {
        "productId": "prod-101",
        "productName": "AuraFlow Active Noise-Cancelling Wireless Headphones",
        "price": 149.99,
        "stockQuantity": 35
      }
    ]
  }
  ```

### 2. Order Placement (`POST /orders`)
- **Payload Validation:**
  - `customerName`: Mandatory, non-empty string.
  - `customerEmail`: Mandatory, valid email regex pattern.
  - `productId`: Mandatory, non-empty string.
  - `quantity`: Mandatory, positive integer strictly greater than zero.
- **Server-Side Pricing Guarantee:**
  - The client **cannot** supply or manipulate unit prices or totals.
  - The server reads `price` from DynamoDB, performs decimal multiplication (`unitPrice * quantity`), and rounds to two decimal places.
- **Atomic Concurrency Guarantee (`TransactWriteItems`):**
  - Inventory decrement and order creation are bound into a single ACID transaction.
  - Uses `ConditionExpression: attribute_exists(productId) AND stockQuantity >= :qty`.
  - If two clients place an order for the last unit simultaneously, only one transaction succeeds; the other returns `409 Conflict`. No partial orders or negative stock can ever occur.
- **HTTP Status Codes:**
  - `201 Created`: Order placed and inventory reserved.
  - `400 Bad Request`: Missing body, malformed JSON, invalid email, or invalid quantity.
  - `404 Not Found`: `productId` not found in catalogue.
  - `409 Conflict`: Insufficient inventory or race-condition conflict.
  - `500 Internal Server Error`: Sanitized error response for unhandled server issues.

### 3. Order Summary (`GET /orders/{orderId}`)
- **Privacy & Security Design:**
  - Returns non-sensitive order summary: `orderId`, `status`, `productId`, `productName`, `quantity`, `unitPrice`, `totalAmount`, and `createdAt`.
  - **Excludes `customerEmail`** and personal customer data to protect customer privacy.
- **HTTP Status Codes:**
  - `200 OK`: Order found and sanitized summary returned.
  - `404 Not Found`: Order ID does not exist.

### 4. Inventory Seeder Script (`scripts/seed_inventory.py`)
- Populates the deployed DynamoDB table with realistic catalogue products.
- Security Note: Catalogue modification is restricted to administrative CLI execution using IAM credentials; no public unauthenticated endpoint can alter prices or stock.

---

## DynamoDB Database Design

### `Products` Table
- **Partition Key (`PK`):** `productId` (String)
- **Billing Mode:** `PAY_PER_REQUEST` (On-Demand)
- **Attributes:**
  - `productId` (String): e.g. `"prod-101"`
  - `productName` (String): e.g. `"AuraFlow Active Noise-Cancelling Wireless Headphones"`
  - `price` (Number / Decimal): e.g. `149.99`
  - `stockQuantity` (Number): e.g. `35`

### `Orders` Table
- **Partition Key (`PK`):** `orderId` (String)
- **Billing Mode:** `PAY_PER_REQUEST` (On-Demand)
- **Stream Specification:** `NEW_IMAGE` (Emits complete new item state on write)
- **Attributes:**
  - `orderId` (String): e.g. `"ord-7e1d52a4b89c"`
  - `customerName` (String): e.g. `"Aarav Sharma"`
  - `customerEmail` (String): e.g. `"aarav@example.com"`
  - `productId` (String): e.g. `"prod-101"`
  - `productName` (String): e.g. `"AuraFlow Active Noise-Cancelling Wireless Headphones"`
  - `quantity` (Number): e.g. `2`
  - `unitPrice` (Number / Decimal): e.g. `149.99`
  - `totalAmount` (Number / Decimal): e.g. `299.98`
  - `status` (String): `"CONFIRMED"`
  - `createdAt` (String): ISO 8601 UTC timestamp

---

## Notification Architecture & Limitations

### How Amazon SNS Notifications Work
1. When a new order is inserted into the `Orders` table, DynamoDB Streams emits a `NEW_IMAGE` event.
2. The `NotificationFunction` filters for `eventName == "INSERT"`. (Updates and Deletions are safely ignored).
3. The function formats a plain-text email and publishes it to the CloudFormation-created SNS Topic (`OrderAlertsTopic`).
4. SNS dispatches the email to the email address configured during deployment in `NotificationEmail`.

> [!IMPORTANT]
> **Subscription Confirmation Required:**
> Immediately after CloudFormation deployment, AWS SNS sends an automated confirmation email with subject **"AWS Notification - Subscription Confirmation"** to the `NotificationEmail` address.
> You **MUST** open that email and click **"Confirm subscription"** before AWS will deliver order alerts.

### ⚠️ Important Architectural Clarification: Project Admin Alert vs. Customer Receipts
- **Current Implementation (Amazon SNS):**
  - This system uses Amazon SNS to deliver new order alerts to the **project/admin notification inbox** specified during deployment.
  - SNS topic subscriptions require upfront explicit opt-in confirmation from the recipient inbox. It is **not designed** to dynamically send one-off order receipts to arbitrary, unverified customer emails entered at checkout.
- **Production Extension for Customer Receipts (Amazon SES):**
  - To send automated confirmation receipts directly to individual customers' unique email addresses (`customerEmail`), you would integrate **Amazon SES (Simple Email Service)**.
  - Amazon SES supports transactional email templates via `ses:SendEmail`.
  - In a standard AWS account (SES Sandbox), sending to arbitrary customer emails requires moving SES out of Sandbox and verifying a domain name with DKIM/SPF records.
  - Therefore, for this project, Amazon SNS is the ideal, standard AWS approach for decoupled order alerting.

---

## Prerequisites

1. **Python 3.11 or 3.12:**
   - Verify in Windows PowerShell: `python --version`
2. **AWS CLI v2:**
   - Install from [AWS CLI Official Documentation](https://aws.amazon.com/cli/).
   - Verify: `aws --version`
3. **AWS SAM CLI:**
   - Install from [AWS SAM Official Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
   - Verify: `sam --version`
4. **Git:**
   - Verify: `git --version`
5. **Docker Desktop (Optional):**
   - Only required if running local SAM container simulation (`sam local start-api`). All unit tests run natively without Docker via `pytest`.

---

## Local Development & Testing

### 1. Configure Python Virtual Environment (Windows PowerShell)

```powershell
# Navigate to project directory
cd c:\Users\anupd\Desktop\CAD

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install development requirements
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
```

### 2. Run Automated Pytest Suite

The automated test suite verifies request validation, server-side calculations, DynamoDB transaction locking, error handling (400, 404, 409, 500), customer email privacy, and notification stream filtering.

```powershell
python -m pytest -v
```

Expected output:
```text
tests/test_notifications.py::test_process_insert_stream_event_publishes_to_sns PASSED
tests/test_notifications.py::test_skip_modify_and_remove_events PASSED
tests/test_notifications.py::test_empty_records_list PASSED
tests/test_notifications.py::test_sns_publish_error_handled_gracefully PASSED
tests/test_order_api.py::test_get_products_success PASSED
tests/test_order_api.py::test_get_products_internal_error PASSED
tests/test_order_api.py::test_post_order_invalid_payloads[...] PASSED (10 cases)
tests/test_order_api.py::test_post_order_success PASSED
tests/test_order_api.py::test_post_order_product_not_found PASSED
tests/test_order_api.py::test_post_order_insufficient_stock PASSED
tests/test_order_api.py::test_post_order_transaction_canceled_conflict PASSED
tests/test_order_api.py::test_get_order_success_excludes_sensitive_email PASSED
tests/test_order_api.py::test_get_order_not_found PASSED
tests/test_order_api.py::test_unrecognized_route_404 PASSED
============================== 23 passed in 0.42s ==============================
```

### 3. Validate and Build with AWS SAM

Once AWS SAM CLI is installed:

```powershell
# Validate SAM template syntax and policies
sam validate

# Build SAM deployment artifacts
sam build
```

---

## AWS Deployment Guide

### Step 1: Configure AWS Credentials Securely
Never use the AWS root account's access keys. Create an IAM user in the AWS Console (e.g. `sam-developer`) with appropriate deployment privileges (`AdministratorAccess` or scoped CloudFormation, Lambda, API Gateway, DynamoDB, SNS permissions).

Run:
```powershell
aws configure
```
Provide:
- **AWS Access Key ID:** `[Your IAM User Access Key]`
- **AWS Secret Access Key:** `[Your IAM User Secret Key]`
- **Default region name:** `ap-south-1` *(Recommended: Mumbai, or us-east-1)*
- **Default output format:** `json`

### Step 2: Deploy Using Guided SAM Wizard

Run the interactive guided deployment:
```powershell
sam deploy --guided
```

You will be prompted with the following inputs:
```text
Setting up create-stack...
Stack Name [serverless-ecommerce]: serverless-ecommerce
AWS Region [ap-south-1]: ap-south-1
Parameter NotificationEmail []: your-admin-email@example.com
Parameter EnvironmentStage [prod]: prod
Confirm changes before deploy [Y/n]: y
Allow SAM CLI IAM role creation [Y/n]: y
Disable rollback for faster debugging [y/N]: n
OrderApiFunction may not have authorization defined, Is this okay? [y/N]: y
Save arguments to configuration file [Y/n]: y
SAM configuration file [samconfig.toml]: samconfig.toml
SAM configuration environment [default]: default
```

> [!NOTE]
> When asked `"OrderApiFunction may not have authorization defined, Is this okay? [y/N]"`, enter `y`. The project uses public HTTP endpoints for catalogue browsing and customer ordering.

### Step 3: Confirm Email Subscription in Your Inbox
Check the inbox for the email entered in `NotificationEmail`. Open the message from **"AWS Notifications"** and click **"Confirm subscription"**.

---

## Seeding the Product Catalogue

After deployment completes, CloudFormation outputs will display your table names and API URLs.

Seed initial catalogue items into your deployed DynamoDB table:

```powershell
# Run the seeding script with your deployed Products table name
python scripts/seed_inventory.py --table-name serverless-ecommerce-Products --region ap-south-1
```

Sample output:
```text
=================================================================
   SERVERLESS E-COMMERCE INVENTORY SEEDER
=================================================================
Target DynamoDB Table: serverless-ecommerce-Products
AWS Region:            ap-south-1
Total Products to Seed: 5

Checking status of table 'serverless-ecommerce-Products'...
Table status is currently: ACTIVE

Writing products to DynamoDB...
  [+] Seeded: prod-101 | AuraFlow Active Noise-Cancelling Wirele  | $149.99 | Stock:  35
  [+] Seeded: prod-102 | KeyForge RGB Mechanical Gaming Keyboard | $ 89.50 | Stock:  50
  [+] Seeded: prod-103 | ErgoPro High-Back Mesh Executive Office | $249.00 | Stock:  20
  [+] Seeded: prod-104 | UltraView 27-inch 4K UHD IPS USB-C Desi | $329.99 | Stock:  15
  [+] Seeded: prod-105 | SpeedCharge 100W GaN Fast Charger with  | $ 39.95 | Stock:  75

=================================================================
SUCCESS: All sample products successfully seeded into DynamoDB!
You can now call 'GET /products' via API Gateway or Postman.
=================================================================
```

---

## Postman & cURL Testing Guide

### Option A: Using Postman
1. Open **Postman**.
2. Click **Import** and select `postman/Serverless-Ecommerce.postman_collection.json`.
3. In the imported collection, click the **Variables** tab:
   - Set `baseUrl` to your deployed `ApiEndpoint` (e.g. `https://xxxx.execute-api.ap-south-1.amazonaws.com/prod`).
4. Execute requests in order:
   - `1. Products - Get Catalogue` -> Returns HTTP 200 with stock and prices.
   - `2. Orders - Create Order (Success 201)` -> Places order and automatically saves `orderId` to collection variables.
   - `3. Orders - Insufficient Stock (Conflict 409)` -> Tests stock protection with excessive quantity.
   - `4. Orders - Invalid Email Format (Bad Request 400)` -> Tests validation rules.
   - `5. Orders - Product Not Found (404)` -> Tests non-existent product handling.
   - `6. Orders - Get Order Details (200 OK)` -> Verifies order details and ensures `customerEmail` is omitted.
   - `7. Orders - Get Non-Existent Order (404 Not Found)` -> Verifies handling of invalid order IDs.

### Option B: Using cURL (PowerShell / Command Prompt)

Set your base URL variable:
```powershell
$API_URL = "https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod"
```

#### 1. Fetch Product Catalogue (`GET /products`):
```powershell
curl -X GET "$API_URL/products" -H "Accept: application/json"
```

#### 2. Create Valid Order (`POST /orders`):
```powershell
curl -X POST "$API_URL/orders" `
  -H "Content-Type: application/json" `
  -d '{
    "customerName": "Aarav Sharma",
    "customerEmail": "aarav.sharma@example.com",
    "productId": "prod-101",
    "quantity": 2
  }'
```
Expected response (`HTTP 201 Created`):
```json
{
  "message": "Order successfully created and inventory reserved.",
  "orderId": "ord-7e1d52a4b89c",
  "status": "CONFIRMED",
  "productId": "prod-101",
  "productName": "AuraFlow Active Noise-Cancelling Wireless Headphones",
  "quantity": 2,
  "unitPrice": 149.99,
  "totalAmount": 299.98,
  "createdAt": "2026-10-22T20:30:00.000000+00:00"
}
```

#### 3. Attempt Order with Insufficient Stock (`POST /orders`):
```powershell
curl -X POST "$API_URL/orders" `
  -H "Content-Type: application/json" `
  -d '{
    "customerName": "Test Buyer",
    "customerEmail": "buyer@example.com",
    "productId": "prod-101",
    "quantity": 99999
  }'
```
Expected response (`HTTP 409 Conflict`):
```json
{
  "error": "Conflict",
  "message": "Insufficient stock for product 'AuraFlow Active Noise-Cancelling Wireless Headphones'. Requested: 99999, Available: 33."
}
```

#### 4. Query Order Summary (`GET /orders/{orderId}`):
```powershell
curl -X GET "$API_URL/orders/ord-7e1d52a4b89c" -H "Accept: application/json"
```
Expected response (`HTTP 200 OK` - customer email is omitted):
```json
{
  "orderId": "ord-7e1d52a4b89c",
  "status": "CONFIRMED",
  "productId": "prod-101",
  "productName": "AuraFlow Active Noise-Cancelling Wireless Headphones",
  "quantity": 2,
  "unitPrice": 149.99,
  "totalAmount": 299.98,
  "createdAt": "2026-10-22T20:30:00.000000+00:00"
}
```

---

## Verification & Observability

### 1. Verify Stock Deductions in DynamoDB
Run `GET /products` again after placing an order. You will see `stockQuantity` decremented by the ordered quantity (e.g., from 35 down to 33).

### 2. Verify DynamoDB Streams & SNS Email
Within 5 to 10 seconds of placing an order:
1. Open the inbox configured in `NotificationEmail`.
2. Locate the email from **"Serverless E-Commerce Order Alerts"** with subject `[Order Alert] Order Confirmed: ord-xxxxxxxxxxxx`.
3. The body contains the structured order summary, customer name, total amount, and timestamp.

### 3. Check CloudWatch Logs via AWS CLI
```powershell
# View logs for Order API Lambda
sam logs --name OrderApiFunction --stack-name serverless-ecommerce --tail

# View logs for Notification Lambda
sam logs --name NotificationFunction --stack-name serverless-ecommerce --tail
```

---

## Troubleshooting Guide

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **`No module named 'boto3'` when running pytest** | Dependencies not installed in active environment | Run `python -m pip install -r requirements-dev.txt` inside your virtual environment. |
| **`sam` is not recognized** | AWS SAM CLI not installed or not on system PATH | Download and install AWS SAM CLI from AWS website, then restart your terminal. |
| **SNS Email notifications not received** | Subscription unconfirmed or email landed in Spam | Check Spam/Junk folder for **"AWS Notification - Subscription Confirmation"** and click the confirmation link. |
| **HTTP 409 Conflict when placing order** | Product stock is depleted or concurrent race condition | Check available stock with `GET /products` or re-seed inventory using `scripts/seed_inventory.py`. |
| **HTTP 404 when calling GET /products** | Wrong API stage in URL or misspelled route | Ensure your URL includes the stage name if required (e.g. `...amazonaws.com/prod/products`). |
| **AccessDenied on DynamoDB or SNS** | IAM permissions missing | The SAM template provides least-privilege IAM policies automatically. Ensure you deploy using `sam deploy`. |

---

## Cleanup & Resource Teardown

To avoid incurring any AWS charges after testing or project evaluation:

```powershell
# Delete the entire CloudFormation stack and all provisioned resources
sam delete --stack-name serverless-ecommerce --region ap-south-1
```
Confirm with `y` when prompted. SAM and CloudFormation will cleanly remove:
- API Gateway HTTP API
- Order API Lambda & Notification Lambda
- Both DynamoDB Tables (`Products` and `Orders`)
- DynamoDB Stream event source mapping
- SNS Topic and Email Subscription
- CloudWatch log groups and IAM roles
