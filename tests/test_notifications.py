"""Unit Tests for Notification Lambda Handler.

Covers:
- DynamoDB Stream INSERT event processing
- SNS notification message formatting
- SNS publish execution
- Filtering out MODIFY and REMOVE stream events (non-INSERTs)
- Resilient error handling when SNS publication encounters an error
- Missing NewImage or empty stream records

Author: Senior Cloud Engineer & Backend Developer
Course: College Cloud Computing Project
"""

import os
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

# Set test environment variable before importing handler
os.environ["TOPIC_ARN"] = "arn:aws:sns:ap-south-1:123456789012:ServerlessEcommerce-OrderAlerts"

from src.notifications import app


@pytest.fixture(autouse=True)
def reset_sns_client():
    """Reset SNS client global before and after each test."""
    app._sns_client = None
    yield
    app._sns_client = None


def create_dynamodb_stream_record(event_name="INSERT", order_id="ord-test123456"):
    """Helper to generate a realistic DynamoDB Stream event record."""
    return {
        "eventID": "1",
        "eventName": event_name,
        "eventVersion": "1.1",
        "eventSource": "aws:dynamodb",
        "awsRegion": "ap-south-1",
        "dynamodb": {
            "ApproximateCreationDateTime": 1729634400,
            "Keys": {
                "orderId": {"S": order_id}
            },
            "NewImage": {
                "orderId": {"S": order_id},
                "customerName": {"S": "Sarah Connor"},
                "customerEmail": {"S": "sarah@example.com"},
                "productId": {"S": "prod-101"},
                "productName": {"S": "Noise Cancelling Headphones"},
                "quantity": {"N": "2"},
                "unitPrice": {"N": "149.99"},
                "totalAmount": {"N": "299.98"},
                "status": {"S": "CONFIRMED"},
                "createdAt": {"S": "2026-10-22T20:00:00+00:00"},
            },
            "SequenceNumber": "111",
            "SizeBytes": 200,
            "StreamViewType": "NEW_IMAGE",
        },
    }


def test_process_insert_stream_event_publishes_to_sns():
    """Test that an INSERT event from DynamoDB Streams triggers an SNS notification."""
    mock_sns = MagicMock()
    mock_sns.publish.return_value = {"MessageId": "msg-sns-12345"}

    event = {
        "Records": [create_dynamodb_stream_record(event_name="INSERT", order_id="ord-abc987")]
    }

    with patch("src.notifications.app.get_sns_client", return_value=mock_sns):
        result = app.lambda_handler(event, None)

    assert result["status"] == "COMPLETED"
    assert result["totalRecords"] == 1
    assert result["processedInserts"] == 1
    assert result["skippedNonInserts"] == 0
    assert result["failedPublishes"] == 0

    mock_sns.publish.assert_called_once()
    call_kwargs = mock_sns.publish.call_args[1]

    assert call_kwargs["TopicArn"] == "arn:aws:sns:ap-south-1:123456789012:ServerlessEcommerce-OrderAlerts"
    assert "ord-abc987" in call_kwargs["Subject"]
    assert "ord-abc987" in call_kwargs["Message"]
    assert "Noise Cancelling Headphones" in call_kwargs["Message"]
    assert "$299.98" in call_kwargs["Message"]
    assert "Sarah Connor" in call_kwargs["Message"]


def test_skip_modify_and_remove_events():
    """Functional Requirement: Only INSERT records must be processed."""
    mock_sns = MagicMock()

    event = {
        "Records": [
            create_dynamodb_stream_record(event_name="MODIFY", order_id="ord-mod1"),
            create_dynamodb_stream_record(event_name="REMOVE", order_id="ord-rem2"),
        ]
    }

    with patch("src.notifications.app.get_sns_client", return_value=mock_sns):
        result = app.lambda_handler(event, None)

    assert result["totalRecords"] == 2
    assert result["processedInserts"] == 0
    assert result["skippedNonInserts"] == 2
    assert result["failedPublishes"] == 0

    # Ensure no SNS notification was dispatched for modifications or deletions
    mock_sns.publish.assert_not_called()


def test_empty_records_list():
    """Test handling an event with no records."""
    event = {"Records": []}
    result = app.lambda_handler(event, None)

    assert result["totalRecords"] == 0
    assert result["processedInserts"] == 0


def test_sns_publish_error_handled_gracefully():
    """Test that SNS publication failures do not crash the Lambda function."""
    mock_sns = MagicMock()
    error_response = {
        "Error": {
            "Code": "EndpointDisabled",
            "Message": "The subscription endpoint is disabled",
        }
    }
    mock_sns.publish.side_effect = ClientError(error_response, "Publish")

    event = {
        "Records": [create_dynamodb_stream_record(event_name="INSERT", order_id="ord-error-test")]
    }

    with patch("src.notifications.app.get_sns_client", return_value=mock_sns):
        result = app.lambda_handler(event, None)

    assert result["status"] == "COMPLETED"
    assert result["totalRecords"] == 1
    assert result["processedInserts"] == 0
    assert result["failedPublishes"] == 1
