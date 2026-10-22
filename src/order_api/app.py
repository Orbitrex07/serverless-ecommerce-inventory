"""Serverless E-Commerce Order API Handler.

This AWS Lambda function serves the HTTP API for:
- GET /products         : Retrieve the catalogue of available products.
- POST /orders          : Validate order, check inventory, and atomically place order.
- GET /orders/{orderId} : Retrieve non-sensitive order summary.

Author: Senior Cloud Engineer & Backend Developer
Course: College Cloud Computing Project
"""

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables injected by AWS SAM / CloudFormation
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE", "")
ORDERS_TABLE = os.environ.get("ORDERS_TABLE", "")

# Regular expression for email validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Lazy-initialized boto3 clients to allow easy mocking and fast cold starts
_dynamodb_client = None
_dynamodb_resource = None


def get_dynamodb_client():
    """Retrieve or initialize DynamoDB low-level client."""
    global _dynamodb_client
    if _dynamodb_client is None:
        _dynamodb_client = boto3.client("dynamodb")
    return _dynamodb_client


def get_dynamodb_resource():
    """Retrieve or initialize DynamoDB high-level resource."""
    global _dynamodb_resource
    if _dynamodb_resource is None:
        _dynamodb_resource = boto3.resource("dynamodb")
    return _dynamodb_resource


class DecimalEncoder(json.JSONEncoder):
    """JSON Encoder helper for DynamoDB Decimal types."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            # Convert to int if no decimal part, otherwise float
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def build_response(status_code: int, body_data: Any) -> Dict[str, Any]:
    """Build a standardized API Gateway HTTP response."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
        },
        "body": json.dumps(body_data, cls=DecimalEncoder),
    }


def parse_route_info(event: Dict[str, Any]) -> Tuple[str, str]:
    """Extract HTTP method and path for both HTTP API v2 and REST API formats."""
    # HTTP API v2 format
    http_ctx = event.get("requestContext", {}).get("http", {})
    method = http_ctx.get("method") or event.get("httpMethod", "GET")
    raw_path = event.get("rawPath") or event.get("path", "")
    return method.upper(), raw_path


# ---------------------------------------------------------------------------
# Route Handlers
# ---------------------------------------------------------------------------

def handle_get_products() -> Dict[str, Any]:
    """GET /products: Return the catalogue of available products."""
    if not PRODUCTS_TABLE:
        logger.error("PRODUCTS_TABLE environment variable is not configured.")
        return build_response(500, {"error": "InternalServerError", "message": "Products table not configured."})

    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(PRODUCTS_TABLE)
        response = table.scan()
        items = response.get("Items", [])

        # Format items cleanly
        catalog = []
        for item in items:
            catalog.append({
                "productId": item.get("productId"),
                "productName": item.get("productName"),
                "price": float(item.get("price", 0.0)),
                "stockQuantity": int(item.get("stockQuantity", 0)),
            })

        # Sort catalog by productId for consistent display
        catalog.sort(key=lambda x: str(x.get("productId", "")))

        logger.info("Successfully fetched %d products.", len(catalog))
        return build_response(200, {"products": catalog, "count": len(catalog)})

    except Exception as exc:
        logger.exception("Failed to scan products table: %s", exc)
        return build_response(500, {"error": "InternalServerError", "message": "Failed to retrieve product catalogue."})


def validate_order_payload(payload: Any) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Validate incoming order request payload."""
    if not isinstance(payload, dict):
        return None, "Request body must be a valid JSON object."

    customer_name = payload.get("customerName")
    if not customer_name or not isinstance(customer_name, str) or not customer_name.strip():
        return None, "Field 'customerName' is required and must be a non-empty string."

    customer_email = payload.get("customerEmail")
    if not customer_email or not isinstance(customer_email, str) or not EMAIL_REGEX.match(customer_email.strip()):
        return None, "Field 'customerEmail' is required and must be a valid email address."

    product_id = payload.get("productId")
    if not product_id or not isinstance(product_id, str) or not product_id.strip():
        return None, "Field 'productId' is required and must be a non-empty string."

    quantity = payload.get("quantity")
    # Must be integer and strictly greater than 0
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
        return None, "Field 'quantity' is required and must be a positive integer greater than 0."

    sanitized = {
        "customerName": customer_name.strip(),
        "customerEmail": customer_email.strip(),
        "productId": product_id.strip(),
        "quantity": quantity,
    }
    return sanitized, None


def handle_post_order(event: Dict[str, Any]) -> Dict[str, Any]:
    """POST /orders: Validate request, calculate server-side total, and atomically place order."""
    if not PRODUCTS_TABLE or not ORDERS_TABLE:
        logger.error("PRODUCTS_TABLE or ORDERS_TABLE environment variable missing.")
        return build_response(500, {"error": "InternalServerError", "message": "Database tables not configured."})

    # 1. Parse JSON body
    body_raw = event.get("body")
    if not body_raw:
        return build_response(400, {"error": "BadRequest", "message": "Missing request body."})

    try:
        payload = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
    except (json.JSONDecodeError, TypeError):
        return build_response(400, {"error": "BadRequest", "message": "Malformed JSON in request body."})

    # 2. Validate input fields
    valid_data, error_msg = validate_order_payload(payload)
    if error_msg:
        return build_response(400, {"error": "BadRequest", "message": error_msg})

    product_id = valid_data["productId"]
    quantity = valid_data["quantity"]
    customer_name = valid_data["customerName"]
    customer_email = valid_data["customerEmail"]

    dynamodb_client = get_dynamodb_client()
    dynamodb_resource = get_dynamodb_resource()

    # 3. Fetch product info directly from Products table (server-side price calculation)
    try:
        products_table = dynamodb_resource.Table(PRODUCTS_TABLE)
        product_resp = products_table.get_item(Key={"productId": product_id})
        product_item = product_resp.get("Item")
    except Exception as exc:
        logger.exception("Error fetching product '%s': %s", product_id, exc)
        return build_response(500, {"error": "InternalServerError", "message": "Failed to verify product availability."})

    if not product_item:
        logger.warning("Product not found: %s", product_id)
        return build_response(404, {"error": "NotFound", "message": f"Product '{product_id}' was not found in the catalogue."})

    product_name = str(product_item.get("productName", "Unknown Product"))
    unit_price = Decimal(str(product_item.get("price", "0.00")))
    available_stock = int(product_item.get("stockQuantity", 0))

    # 4. Check available stock prior to transaction
    if available_stock < quantity:
        logger.warning(
            "Insufficient stock for product %s. Requested: %d, Available: %d",
            product_id, quantity, available_stock,
        )
        return build_response(
            409,
            {
                "error": "Conflict",
                "message": f"Insufficient stock for product '{product_name}'. Requested: {quantity}, Available: {available_stock}.",
            },
        )

    # 5. Compute server-side financial values
    total_amount = round(unit_price * Decimal(quantity), 2)
    order_id = f"ord-{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    # 6. Execute atomic TransactWriteItems:
    #    - Decrement stock in ProductsTable conditioned on stockQuantity >= quantity
    #    - Insert new order in OrdersTable conditioned on orderId uniqueness
    transact_items = [
        {
            "Update": {
                "TableName": PRODUCTS_TABLE,
                "Key": {"productId": {"S": product_id}},
                "UpdateExpression": "SET stockQuantity = stockQuantity - :qty",
                "ConditionExpression": "attribute_exists(productId) AND stockQuantity >= :qty",
                "ExpressionAttributeValues": {":qty": {"N": str(quantity)}},
            }
        },
        {
            "Put": {
                "TableName": ORDERS_TABLE,
                "Item": {
                    "orderId": {"S": order_id},
                    "customerName": {"S": customer_name},
                    "customerEmail": {"S": customer_email},
                    "productId": {"S": product_id},
                    "productName": {"S": product_name},
                    "quantity": {"N": str(quantity)},
                    "unitPrice": {"N": str(unit_price)},
                    "totalAmount": {"N": str(total_amount)},
                    "status": {"S": "CONFIRMED"},
                    "createdAt": {"S": created_at},
                },
                "ConditionExpression": "attribute_not_exists(orderId)",
            }
        },
    ]

    try:
        dynamodb_client.transact_write_items(TransactItems=transact_items)
        # Log success without logging sensitive customer email
        logger.info("Order %s successfully placed for product %s (qty=%d, total=%s)", order_id, product_id, quantity, total_amount)

        return build_response(
            201,
            {
                "message": "Order successfully created and inventory reserved.",
                "orderId": order_id,
                "status": "CONFIRMED",
                "productId": product_id,
                "productName": product_name,
                "quantity": quantity,
                "unitPrice": float(unit_price),
                "totalAmount": float(total_amount),
                "createdAt": created_at,
            },
        )

    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        logger.warning("DynamoDB transaction failed with code %s: %s", code, exc)

        if code == "TransactionCanceledException":
            # Check reasons if stock was consumed right before transaction finished
            return build_response(
                409,
                {
                    "error": "Conflict",
                    "message": "Inventory reservation failed due to concurrent order or insufficient stock.",
                },
            )

        logger.exception("Unexpected DynamoDB ClientError during TransactWriteItems: %s", exc)
        return build_response(500, {"error": "InternalServerError", "message": "An error occurred while placing the order."})

    except Exception as exc:
        logger.exception("Unexpected error placing order: %s", exc)
        return build_response(500, {"error": "InternalServerError", "message": "An unexpected error occurred."})


def handle_get_order(order_id: str) -> Dict[str, Any]:
    """GET /orders/{orderId}: Return non-sensitive order summary."""
    if not ORDERS_TABLE:
        logger.error("ORDERS_TABLE environment variable missing.")
        return build_response(500, {"error": "InternalServerError", "message": "Orders table not configured."})

    if not order_id or not order_id.strip():
        return build_response(400, {"error": "BadRequest", "message": "orderId parameter is required."})

    clean_order_id = order_id.strip()

    try:
        dynamodb = get_dynamodb_resource()
        table = dynamodb.Table(ORDERS_TABLE)
        response = table.get_item(Key={"orderId": clean_order_id})
        item = response.get("Item")

        if not item:
            logger.info("Order %s not found.", clean_order_id)
            return build_response(404, {"error": "NotFound", "message": f"Order '{clean_order_id}' was not found."})

        # Sanitize output: Never expose customerEmail or unnecessary personal contact details
        summary = {
            "orderId": item.get("orderId"),
            "status": item.get("status"),
            "productId": item.get("productId"),
            "productName": item.get("productName"),
            "quantity": int(item.get("quantity", 0)),
            "unitPrice": float(item.get("unitPrice", 0.0)),
            "totalAmount": float(item.get("totalAmount", 0.0)),
            "createdAt": item.get("createdAt"),
        }

        logger.info("Retrieved summary for order %s.", clean_order_id)
        return build_response(200, summary)

    except Exception as exc:
        logger.exception("Error retrieving order %s: %s", clean_order_id, exc)
        return build_response(500, {"error": "InternalServerError", "message": "Failed to retrieve order."})


# ---------------------------------------------------------------------------
# Lambda Main Entrypoint
# ---------------------------------------------------------------------------

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """AWS Lambda entrypoint dispatching requests based on method and route."""
    logger.info("Received event: %s", json.dumps({"rawPath": event.get("rawPath"), "httpMethod": event.get("httpMethod")}))

    method, path = parse_route_info(event)

    # 1. GET /products
    if method == "GET" and (path == "/products" or path.endswith("/products")):
        return handle_get_products()

    # 2. POST /orders
    if method == "POST" and (path == "/orders" or path.endswith("/orders")):
        return handle_post_order(event)

    # 3. GET /orders/{orderId}
    if method == "GET":
        # Check pathParameters first
        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("orderId")

        # Fallback: parse from path directly if pathParameters is missing
        if not order_id and "/orders/" in path:
            parts = path.rstrip("/").split("/orders/")
            if len(parts) > 1 and parts[1]:
                order_id = parts[1]

        if order_id:
            return handle_get_order(order_id)

    # Handle OPTIONS preflight request
    if method == "OPTIONS":
        return build_response(200, {"message": "OK"})

    # Route Not Found
    logger.warning("Unrecognized route: %s %s", method, path)
    return build_response(404, {"error": "NotFound", "message": f"Route '{method} {path}' does not exist."})
