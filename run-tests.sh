#!/usr/bin/env bash

# Inventory Module E2E Test Runner
# This script runs the complete Inventory module test suite

set -e

echo "=========================================="
echo "  Ayurshala Inventory E2E Test Suite"
echo "=========================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo "✓ Node.js version: $(node -v)"
echo "✓ npm version: $(npm -v)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if @playwright/test is installed
if ! npm list @playwright/test &>/dev/null; then
    echo "📦 Installing Playwright..."
    npm install -D @playwright/test
    echo ""
fi

# Set test environment
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export CI="${CI:-false}"

echo "🧪 Running Inventory Module E2E Tests"
echo "URL: $BASE_URL"
echo ""

# Run tests based on argument
case "${1:-all}" in
    all)
        echo "Running all tests..."
        npm run test:inventory
        ;;
    ui)
        echo "Running tests with UI..."
        npm run test:inventory:ui
        ;;
    headed)
        echo "Running tests with headed browser..."
        npm run test:inventory:headed
        ;;
    masters)
        echo "Running masters tests..."
        npm run test:masters
        ;;
    po)
        echo "Running purchase order tests..."
        npm run test:purchase-orders
        ;;
    grn)
        echo "Running GRN tests..."
        npm run test:grn
        ;;
    reports)
        echo "Running report tests..."
        npm run test:reports
        ;;
    api)
        echo "Running API tests..."
        npm run test:api
        ;;
    comprehensive)
        echo "Running comprehensive validation..."
        npm run test:comprehensive
        ;;
    debug)
        echo "Running tests in debug mode..."
        npm run test:inventory:debug
        ;;
    ci)
        echo "Running tests in CI mode..."
        npm run test:inventory:ci
        ;;
    report)
        echo "Opening test report..."
        npm run test:inventory:report
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all            Run all tests"
        echo "  ui             Run tests with UI mode"
        echo "  headed         Run tests with visible browser"
        echo "  masters        Run masters module tests"
        echo "  po             Run purchase order tests"
        echo "  grn            Run GRN tests"
        echo "  reports        Run reports tests"
        echo "  api            Run API tests"
        echo "  comprehensive  Run comprehensive validation"
        echo "  debug          Run tests in debug mode"
        echo "  ci             Run tests in CI mode"
        echo "  report         Open HTML report"
        echo ""
        exit 1
        ;;
esac

echo ""
echo "✓ Test suite completed"
echo ""
echo "📊 To view detailed results, run:"
echo "   npm run test:inventory:report"
