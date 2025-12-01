#!/bin/bash

# Test Metadata Endpoint
# Usage: ./test-metadata.sh

echo "🧪 Testing TRQP Metadata Endpoint"
echo "=================================="
echo ""

BASE_URL="http://localhost:3000"

echo "📡 Fetching metadata from: ${BASE_URL}/v2/metadata"
echo ""

# Test 1: Get metadata
echo "Test 1: GET /v2/metadata"
echo "------------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.'
echo ""
echo ""

# Test 2: Check protocol version
echo "Test 2: Check Protocol Version"
echo "-------------------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.protocol, .version'
echo ""
echo ""

# Test 3: List supported actions
echo "Test 3: Supported Actions"
echo "-------------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.supportedActions'
echo ""
echo ""

# Test 4: List supported DID methods
echo "Test 4: Supported DID Methods"
echo "-----------------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.supportedDIDMethods'
echo ""
echo ""

# Test 5: Check features
echo "Test 5: Feature Flags"
echo "---------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.features'
echo ""
echo ""

# Test 6: Get endpoints
echo "Test 6: Available Endpoints"
echo "---------------------------"
curl -s -X GET "${BASE_URL}/v2/metadata" | jq '.endpoints'
echo ""
echo ""

echo "✅ All tests completed!"
