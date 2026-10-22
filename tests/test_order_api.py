"""Unit Tests for Order API Lambda Handler.

Covers:
- GET /products catalogue retrieval
- POST /orders payload validation (required fields, positive quantity, valid email format)
- Server-side price calculation and total amount verification
- Atomic TransactWriteItems execution
- Missing product error (404)
- Insufficient inventory error (409)
- Transaction conflict / race condition (409)
- GET /orders/{orderId} non-sensitive summary retrieval (ensuring customerEmail privacy)
- Order not found error (404)
- Sanitized 500 error handling

Author: Senior Cloud Engineer & Backend Developer
Course: College Cloud Computing Project
"""

import json
import os
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# Set test environment variables before importing app
os.environ["PRODUCTS_TABLE"] = "TestProductsTable"
os.environ["ORDERS_TABLE"] = "TestOrdersTable"

from src.order_api import app


@pytest.fixture(autouse=True)
def reset_dynamodb_globals():
    """Ensure cached boto3 client and resource globals are reset before each test."""
    app._dynamodb_client = None
    app._dynamodb_resource = None
    yield
    app._dynamodb_client = None
    app._dynamodb_resource = None


# ---------------------------------------------------------------------------
# GET /products Tests
# ---------------------------------------------------------------------------

def test_get_products_success():
    """Test that GET /products scans DynamoDB and formats the catalogue."""
    mock_resource = MagicMock()
    mock_table = MagicMock()
    mock_resource.Table.return_value = mock_table

    mock_table.scan.return_value = {
        "Items": [
            {
                "productId": "prod-101",
                "productName": "Wireless Headphones",
                "price": Decimal("149.99"),
                "stockQuantity": Decimal("25"),
            },
            {
                "productId": "prod-102",
                "productName": "Mechanical Keyboard",
                "price": Decimal("89.50"),
                "stockQuantity": Decimal("40"),
            },
        ]
    }

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/products",
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 200
    data = json.loads(response["body"])
    assert data["count"] == 2
    assert len(data["products"]) == 2
    assert data["products"][0]["productId"] == "prod-101"
    assert data["products"][0]["price"] == 149.99
    assert data["products"][0]["stockQuantity"] == 25


def test_get_products_internal_error():
    """Test that a failure during scanning returns a sanitized 500 response."""
    mock_resource = MagicMock()
    mock_table = MagicMock()
    mock_resource.Table.return_value = mock_table
    mock_table.scan.side_effect = Exception("DynamoDB service unavailable")

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/products",
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 500
    data = json.loads(response["body"])
    assert data["error"] == "InternalServerError"


# ---------------------------------------------------------------------------
# POST /orders Validation Tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "payload, expected_error_msg",
    [
        (None, "Missing request body"),
        ("invalid-json{", "Malformed JSON in request body"),
        ([], "Request body must be a valid JSON object"),
        ({"customerName": ""}, "customerName"),
        ({"customerName": "John", "customerEmail": "not-an-email"}, "customerEmail"),
        (
            {"customerName": "John", "customerEmail": "john@example.com", "productId": ""},
            "productId",
        ),
        (
            {"customerName": "John", "customerEmail": "john@example.com", "productId": "prod-1", "quantity": 0},
            "quantity",
        ),
        (
            {"customerName": "John", "customerEmail": "john@example.com", "productId": "prod-1", "quantity": -5},
            "quantity",
        ),
        (
            {"customerName": "John", "customerEmail": "john@example.com", "productId": "prod-1", "quantity": "two"},
            "quantity",
        ),
        (
            {"customerName": "John", "customerEmail": "john@example.com", "productId": "prod-1", "quantity": True},
            "quantity",
        ),
    ],
)
def test_post_order_invalid_payloads(payload, expected_error_msg):
    """Test validation errors for missing or invalid request bodies."""
    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/orders",
        "body": json.dumps(payload) if isinstance(payload, (dict, list)) else payload,
    }

    response = app.lambda_handler(event, None)
    assert response["statusCode"] == 400
    data = json.loads(response["body"])
    assert data["error"] == "BadRequest"
    assert expected_error_msg.lower() in data["message"].lower()


# ---------------------------------------------------------------------------
# POST /orders Business Logic Tests
# ---------------------------------------------------------------------------

def test_post_order_success():
    """Test successful order creation with atomic TransactWriteItems."""
    mock_resource = MagicMock()
    mock_products_table = MagicMock()
    mock_resource.Table.return_value = mock_products_table

    # Mock product in catalog
    mock_products_table.get_item.return_value = {
        "Item": {
            "productId": "prod-101",
            "productName": "Wireless Headphones",
            "price": Decimal("149.99"),
            "stockQuantity": Decimal("10"),
        }
    }

    mock_client = MagicMock()

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/orders",
        "body": json.dumps({
            "customerName": "Alice Johnson",
            "customerEmail": "alice@example.com",
            "productId": "prod-101",
            "quantity": 2,
        }),
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource), \
         patch("src.order_api.app.get_dynamodb_client", return_value=mock_client):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 201
    data = json.loads(response["body"])
    assert data["status"] == "CONFIRMED"
    assert data["productId"] == "prod-101"
    assert data["productName"] == "Wireless Headphones"
    assert data["quantity"] == 2
    assert data["unitPrice"] == 149.99
    # Server-calculated total: 149.99 * 2 = 299.98
    assert data["totalAmount"] == 299.98
    assert data["orderId"].startswith("ord-")

    # Verify TransactWriteItems call
    mock_client.transact_write_items.assert_called_once()
    transact_call_args = mock_client.transact_write_items.call_args[1]["TransactItems"]
    assert len(transact_call_args) == 2

    # Item 1: Decrement inventory with condition
    update_item = transact_call_args[0]["Update"]
    assert update_item["TableName"] == "TestProductsTable"
    assert "stockQuantity = stockQuantity - :qty" in update_item["UpdateExpression"]
    assert "stockQuantity >= :qty" in update_item["ConditionExpression"]
    assert update_item["ExpressionAttributeValues"][":qty"]["N"] == "2"

    # Item 2: Save Order
    put_item = transact_call_args[1]["Put"]
    assert put_item["TableName"] == "TestOrdersTable"
    assert put_item["Item"]["productId"]["S"] == "prod-101"
    assert put_item["Item"]["totalAmount"]["N"] == "299.98"


def test_post_order_product_not_found():
    """Test that requesting an unlisted product returns 404."""
    mock_resource = MagicMock()
    mock_products_table = MagicMock()
    mock_resource.Table.return_value = mock_products_table
    mock_products_table.get_item.return_value = {}  # Item not found

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/orders",
        "body": json.dumps({
            "customerName": "Bob",
            "customerEmail": "bob@example.com",
            "productId": "prod-999",
            "quantity": 1,
        }),
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 404
    data = json.loads(response["body"])
    assert data["error"] == "NotFound"
    assert "prod-999" in data["message"]


def test_post_order_insufficient_stock():
    """Test that requesting more stock than available returns 409 Conflict."""
    mock_resource = MagicMock()
    mock_products_table = MagicMock()
    mock_resource.Table.return_value = mock_products_table

    mock_products_table.get_item.return_value = {
        "Item": {
            "productId": "prod-101",
            "productName": "Wireless Headphones",
            "price": Decimal("149.99"),
            "stockQuantity": Decimal("3"),  # Only 3 in stock
        }
    }

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/orders",
        "body": json.dumps({
            "customerName": "Charlie",
            "customerEmail": "charlie@example.com",
            "productId": "prod-101",
            "quantity": 5,  # Requesting 5
        }),
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 409
    data = json.loads(response["body"])
    assert data["error"] == "Conflict"
    assert "Insufficient stock" in data["message"]


def test_post_order_transaction_canceled_conflict():
    """Test race condition handling when TransactWriteItems condition check fails."""
    mock_resource = MagicMock()
    mock_products_table = MagicMock()
    mock_resource.Table.return_value = mock_products_table

    mock_products_table.get_item.return_value = {
        "Item": {
            "productId": "prod-101",
            "productName": "Wireless Headphones",
            "price": Decimal("149.99"),
            "stockQuantity": Decimal("5"),
        }
    }

    mock_client = MagicMock()
    error_response = {
        "Error": {
            "Code": "TransactionCanceledException",
            "Message": "Transaction cancelled, conditional check failed",
        }
    }
    mock_client.transact_write_items.side_effect = ClientError(error_response, "TransactWriteItems")

    event = {
        "requestContext": {"http": {"method": "POST"}},
        "rawPath": "/orders",
        "body": json.dumps({
            "customerName": "David",
            "customerEmail": "david@example.com",
            "productId": "prod-101",
            "quantity": 5,
        }),
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource), \
         patch("src.order_api.app.get_dynamodb_client", return_value=mock_client):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 409
    data = json.loads(response["body"])
    assert data["error"] == "Conflict"
    assert "Inventory reservation failed" in data["message"]


# ---------------------------------------------------------------------------
# GET /orders/{orderId} Tests
# ---------------------------------------------------------------------------

def test_get_order_success_excludes_sensitive_email():
    """Critical Requirement: GET /orders/{orderId} must NOT return customer email."""
    mock_resource = MagicMock()
    mock_orders_table = MagicMock()
    mock_resource.Table.return_value = mock_orders_table

    mock_orders_table.get_item.return_value = {
        "Item": {
            "orderId": "ord-abc123456789",
            "customerName": "Emma Watson",
            "customerEmail": "emma.watson@private-email.com",  # Sensitive!
            "productId": "prod-101",
            "productName": "Wireless Headphones",
            "quantity": Decimal("1"),
            "unitPrice": Decimal("149.99"),
            "totalAmount": Decimal("149.99"),
            "status": "CONFIRMED",
            "createdAt": "2026-10-22T20:00:00+00:00",
        }
    }

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/orders/ord-abc123456789",
        "pathParameters": {"orderId": "ord-abc123456789"},
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 200
    data = json.loads(response["body"])

    assert data["orderId"] == "ord-abc123456789"
    assert data["status"] == "CONFIRMED"
    assert data["productName"] == "Wireless Headphones"
    assert data["quantity"] == 1
    assert data["totalAmount"] == 149.99

    # CRITICAL SECURITY & PRIVACY ASSERTION
    assert "customerEmail" not in data
    assert "private-email.com" not in response["body"]


def test_get_order_not_found():
    """Test retrieving an unknown orderId returns 404."""
    mock_resource = MagicMock()
    mock_orders_table = MagicMock()
    mock_resource.Table.return_value = mock_orders_table
    mock_orders_table.get_item.return_value = {}  # Not found

    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/orders/ord-nonexistent",
        "pathParameters": {"orderId": "ord-nonexistent"},
    }

    with patch("src.order_api.app.get_dynamodb_resource", return_value=mock_resource):
        response = app.lambda_handler(event, None)

    assert response["statusCode"] == 404
    data = json.loads(response["body"])
    assert data["error"] == "NotFound"
    assert "ord-nonexistent" in data["message"]


def test_unrecognized_route_404():
    """Test calling an unknown method or path returns 404."""
    event = {
        "requestContext": {"http": {"method": "DELETE"}},
        "rawPath": "/products",
    }
    response = app.lambda_handler(event, None)
    assert response["statusCode"] == 404
    data = json.loads(response["body"])
    assert data["error"] == "NotFound"
