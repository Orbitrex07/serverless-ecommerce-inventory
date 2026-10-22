#!/usr/bin/env python3
"""Seed Inventory Script for Serverless E-Commerce System.

This script populates the deployed Amazon DynamoDB Products table with
realistic initial catalogue items.

Functional Security Note:
- Inventory updates are intentionally restricted to this administrative script
  using AWS IAM credentials, rather than exposed via public HTTP endpoints.

Usage:
    python scripts/seed_inventory.py --table-name <ProductsTableName> --region <aws-region>

Example:
    python scripts/seed_inventory.py --table-name ServerlessEcommerce-ProductsTable-XYZ --region ap-south-1

Author: Senior Cloud Engineer & Backend Developer
Course: College Cloud Computing Project
"""

import argparse
import sys
from decimal import Decimal
from typing import List, Dict, Any
import boto3
from botocore.exceptions import ClientError

# High-quality sample products for an electronics & productivity gear e-commerce shop
SAMPLE_PRODUCTS: List[Dict[str, Any]] = [
    {
        "productId": "prod-101",
        "productName": "AuraFlow Active Noise-Cancelling Wireless Headphones",
        "price": Decimal("149.99"),
        "stockQuantity": 35,
    },
    {
        "productId": "prod-102",
        "productName": "KeyForge RGB Mechanical Gaming Keyboard (Hot-Swappable)",
        "price": Decimal("89.50"),
        "stockQuantity": 50,
    },
    {
        "productId": "prod-103",
        "productName": "ErgoPro High-Back Mesh Executive Office Chair",
        "price": Decimal("249.00"),
        "stockQuantity": 20,
    },
    {
        "productId": "prod-104",
        "productName": "UltraView 27-inch 4K UHD IPS USB-C Designer Monitor",
        "price": Decimal("329.99"),
        "stockQuantity": 15,
    },
    {
        "productId": "prod-105",
        "productName": "SpeedCharge 100W GaN Fast Charger with Dual USB-C",
        "price": Decimal("39.95"),
        "stockQuantity": 75,
    },
]


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments for table name and AWS region."""
    parser = argparse.ArgumentParser(
        description="Seed initial inventory into the Serverless E-Commerce DynamoDB Products table."
    )
    parser.add_argument(
        "-t",
        "--table-name",
        required=True,
        help="Name of the deployed DynamoDB Products table (e.g. from CloudFormation outputs).",
    )
    parser.add_argument(
        "-r",
        "--region",
        default="ap-south-1",
        help="AWS Region where the stack is deployed (default: ap-south-1 [Mumbai]).",
    )
    return parser.parse_args()


def seed_inventory(table_name: str, region: str) -> bool:
    """Insert sample products into DynamoDB Products table."""
    print("=" * 65)
    print("   SERVERLESS E-COMMERCE INVENTORY SEEDER")
    print("=" * 65)
    print(f"Target DynamoDB Table: {table_name}")
    print(f"AWS Region:            {region}")
    print(f"Total Products to Seed: {len(SAMPLE_PRODUCTS)}\n")

    try:
        session = boto3.Session(region_name=region)
        dynamodb = session.resource("dynamodb")
        table = dynamodb.Table(table_name)

        # Verify table existence by checking table status
        print(f"Checking status of table '{table_name}'...")
        table_status = table.table_status
        print(f"Table status is currently: {table_status}\n")

        print("Writing products to DynamoDB...")
        with table.batch_writer() as batch:
            for item in SAMPLE_PRODUCTS:
                batch.put_item(Item=item)
                print(
                    f"  [+] Seeded: {item['productId']} | {item['productName'][:40]:<40} | "
                    f"${float(item['price']):>6.2f} | Stock: {item['stockQuantity']:>3}"
                )

        print("\n" + "=" * 65)
        print("SUCCESS: All sample products successfully seeded into DynamoDB!")
        print("You can now call 'GET /products' via API Gateway or Postman.")
        print("=" * 65)
        return True

    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "Unknown")
        error_msg = exc.response.get("Error", {}).get("Message", str(exc))
        print(f"\n[ERROR] AWS ClientError [{error_code}]: {error_msg}", file=sys.stderr)
        print("Tip: Ensure your AWS credentials are valid and the table name is correct.", file=sys.stderr)
        return False
    except Exception as exc:
        print(f"\n[ERROR] Unexpected error: {exc}", file=sys.stderr)
        return False


def main():
    """Main execution point."""
    args = parse_arguments()
    success = seed_inventory(table_name=args.table_name, region=args.region)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
