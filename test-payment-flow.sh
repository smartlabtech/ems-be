#!/bin/bash

# Test Payment Flow Script
# This script helps test the payment flow step by step

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL - change if needed
BASE_URL="http://localhost:3041/api"
LANG="en"

# Function to print colored output
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check if JWT token is provided
if [ -z "$1" ]; then
    print_error "Please provide JWT token as first argument"
    echo "Usage: ./test-payment-flow.sh YOUR_JWT_TOKEN [ORDER_ID]"
    exit 1
fi

JWT_TOKEN=$1
ORDER_ID=$2

# If ORDER_ID is provided, skip to payment status check
if [ ! -z "$ORDER_ID" ]; then
    print_step "Checking payment status for order: $ORDER_ID"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        "${BASE_URL}/${LANG}/payment/status/${ORDER_ID}" \
        -H "Authorization: Bearer ${JWT_TOKEN}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    print_info "HTTP Status: $http_code"
    print_info "Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    
    exit 0
fi

# Step 1: Get current subscription
print_step "Getting current subscription..."
response=$(curl -s -X GET \
    "${BASE_URL}/${LANG}/subscription/current" \
    -H "Authorization: Bearer ${JWT_TOKEN}")

echo "$response" | jq . 2>/dev/null || echo "$response"

# Check if user already has active subscription
if echo "$response" | grep -q '"status":"active"'; then
    print_info "User already has an active subscription"
    exit 0
fi

# Step 2: Get available plans
print_step "Getting available plans..."
response=$(curl -s -X GET \
    "${BASE_URL}/${LANG}/plan/selection" \
    -H "Authorization: Bearer ${JWT_TOKEN}")

echo "$response" | jq '.[0]' 2>/dev/null || echo "$response"

# Extract first plan ID (you might want to change this)
PLAN_ID=$(echo "$response" | jq -r '.[0]._id' 2>/dev/null)

if [ -z "$PLAN_ID" ] || [ "$PLAN_ID" = "null" ]; then
    print_error "No plans available"
    exit 1
fi

print_info "Using plan ID: $PLAN_ID"

# Step 3: Initiate subscription
print_step "Initiating subscription..."
response=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/${LANG}/subscription/initiate" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"planId\": \"${PLAN_ID}\"}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

print_info "HTTP Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"

# Extract order ID if payment is required
ORDER_ID=$(echo "$body" | jq -r '.orderId' 2>/dev/null)

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
    print_info "No payment required (possibly free plan)"
    exit 0
fi

print_info "Order ID: $ORDER_ID"

# Step 4: Create payment checkout
print_step "Creating payment checkout..."
response=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/${LANG}/payment/checkout/${ORDER_ID}" \
    -H "Authorization: Bearer ${JWT_TOKEN}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

print_info "HTTP Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"

# Extract payment URL
PAYMENT_URL=$(echo "$body" | jq -r '.paymentUrl' 2>/dev/null)

if [ ! -z "$PAYMENT_URL" ] && [ "$PAYMENT_URL" != "null" ]; then
    print_info "Payment URL: $PAYMENT_URL"
    print_info "Please visit this URL to complete payment"
fi

# Step 5: Check payment status
print_step "Checking payment status..."
response=$(curl -s -w "\n%{http_code}" -X GET \
    "${BASE_URL}/${LANG}/payment/status/${ORDER_ID}" \
    -H "Authorization: Bearer ${JWT_TOKEN}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

print_info "HTTP Status: $http_code"
echo "$body" | jq . 2>/dev/null || echo "$body"

print_info "To check payment status again, run:"
echo "./test-payment-flow.sh $JWT_TOKEN $ORDER_ID"