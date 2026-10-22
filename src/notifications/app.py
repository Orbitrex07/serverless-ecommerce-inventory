"""Serverless E-Commerce Notification Lambda Handler.

This Lambda function is triggered asynchronously by DynamoDB Streams on the Orders table:
- Filters for new INSERT events (new orders only).
- Extracts order metadata from the DynamoDB NewImage.
- Formats an executive notification message.
- Publishes the notification to an Amazon SNS topic for email dispatch to project administrators.

Resilience Guarantee:
- A failure in SNS publication will not retroactively cancel or re-trigger an already-accepted order.

Author: Senior Cloud Engineer & Backend Developer
Course: College Cloud Computing Project
"""

import json
import logging
import os
from typing import Any, Dict

import boto3
from boto3.dynamodb.types import TypeDeserializer
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
TOPIC_ARN = os.environ.get("TOPIC_ARN", "")

# Lazy-initialized clients and helpers
_sns_client = None
_deserializer = TypeDeserializer()


def get_sns_client():
    """Retrieve or initialize the SNS client."""
    global _sns_client
    if _sns_client is None:
        _sns_client = boto3.client("sns")
    return _sns_client


def deserialize_dynamodb_image(image_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Convert DynamoDB low-level JSON structure into standard Python dictionary."""
    if not image_dict:
        return {}
    return {k: _deserializer.deserialize(v) for k, v in image_dict.items()}


def format_notification_message(order_data: Dict[str, Any]) -> str:
    """Format plain-text email message for administrative notification."""
    order_id = order_data.get("orderId", "N/A")
    customer_name = order_data.get("customerName", "Valued Customer")
    product_id = order_data.get("productId", "N/A")
    product_name = order_data.get("productName", "N/A")
    quantity = order_data.get("quantity", 0)
    unit_price = order_data.get("unitPrice", 0.0)
    total_amount = order_data.get("totalAmount", 0.0)
    status = order_data.get("status", "CONFIRMED")
    created_at = order_data.get("createdAt", "N/A")

    return (
        "==========================================================\n"
        "  NEW E-COMMERCE ORDER CONFIRMATION\n"
        "==========================================================\n\n"
        f"Order ID:        {order_id}\n"
        f"Order Status:    {status}\n"
        f"Date & Time:     {created_at} UTC\n\n"
        "--- CUSTOMER INFORMATION ---\n"
        f"Customer Name:   {customer_name}\n\n"
        "--- ORDER DETAILS ---\n"
        f"Product ID:      {product_id}\n"
        f"Product Name:    {product_name}\n"
        f"Quantity:        {quantity}\n"
        f"Unit Price:      ${float(unit_price):,.2f}\n"
        f"Total Amount:    ${float(total_amount):,.2f}\n\n"
        "==========================================================\n"
        "Inventory has been reserved atomically in Amazon DynamoDB.\n"
        "Note: This alert is sent to project administrators via Amazon SNS.\n"
        "Direct customer emails require an Amazon SES verified identity.\n"
        "==========================================================\n"
    )


def process_insert_record(record: Dict[str, Any]) -> bool:
    """Process a single DynamoDB stream INSERT record and publish to SNS."""
    dynamodb_payload = record.get("dynamodb", {})
    new_image = dynamodb_payload.get("NewImage")

    if not new_image:
        logger.warning("Record missing NewImage: %s", record.get("eventID"))
        return False

    order_data = deserialize_dynamodb_image(new_image)
    order_id = order_data.get("orderId")

    if not order_id:
        logger.warning("Missing orderId in record image: %s", record.get("eventID"))
        return False

    # Log record receipt without logging customer email
    logger.info("Processing DynamoDB stream INSERT for Order ID: %s", order_id)

    if not TOPIC_ARN:
        logger.error("TOPIC_ARN environment variable is not configured. Cannot publish SNS notification.")
        return False

    sns_client = get_sns_client()
    subject = f"[Order Alert] Order Confirmed: {order_id}"
    message = format_notification_message(order_data)

    try:
        response = sns_client.publish(
            TopicArn=TOPIC_ARN,
            Subject=subject[:100],  # SNS Subject line limit is 100 characters
            Message=message,
        )
        logger.info("Successfully published SNS notification for Order %s. MessageId: %s", order_id, response.get("MessageId"))
        return True

    except ClientError as exc:
        # Crucial requirement: Log error, but do NOT disrupt system or re-order
        logger.exception("Failed to publish SNS notification for Order %s: %s", order_id, exc)
        return False
    except Exception as exc:
        logger.exception("Unexpected error publishing notification for Order %s: %s", order_id, exc)
        return False


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda entrypoint for DynamoDB Streams."""
    records = event.get("Records", [])
    logger.info("Received DynamoDB Stream event with %d records.", len(records))

    processed_count = 0
    skipped_count = 0
    failed_count = 0

    for record in records:
        event_name = record.get("eventName")

        # Functional Requirement: Process new INSERT records only
        if event_name != "INSERT":
            logger.info("Skipping non-INSERT event (type=%s, eventID=%s)", event_name, record.get("eventID"))
            skipped_count += 1
            continue

        success = process_insert_record(record)
        if success:
            processed_count += 1
        else:
            failed_count += 1

    summary = {
        "status": "COMPLETED",
        "totalRecords": len(records),
        "processedInserts": processed_count,
        "skippedNonInserts": skipped_count,
        "failedPublishes": failed_count,
    }
    logger.info("Stream processing summary: %s", json.dumps(summary))
    return summary
