#!/bin/bash

# Script para testar o CLI manualmente
# Execute: bash scripts/test-cli-manually.sh

set -e

echo "🧪 FSD Coach - Manual CLI Test"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create temp directory
TEST_DIR="/tmp/fsd-coach-manual-test-$(date +%s)"
mkdir -p "$TEST_DIR"
echo "📁 Test directory: $TEST_DIR"
echo ""

cd "$TEST_DIR"

# Function to check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 FAILED${NC}"
        exit 1
    fi
}

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓ File exists: $1${NC}"
    else
        echo -e "${RED}✗ File missing: $1${NC}"
        exit 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓ Directory exists: $1${NC}"
    else
        echo -e "${RED}✗ Directory missing: $1${NC}"
        exit 1
    fi
}

# Get the CLI path (assuming running from project root)
CLI_PATH="$(pwd)/../../packages/cli/dist/cli.js"

if [ ! -f "$CLI_PATH" ]; then
    echo -e "${RED}✗ CLI not built. Run 'pnpm build' first${NC}"
    exit 1
fi

echo "🔨 Using CLI: $CLI_PATH"
echo ""

# Test 1: Init project
echo "📦 Test 1: Initialize project with next-app template"
node "$CLI_PATH" init --template next-app
check_result "Init command executed"

check_file "README.fsd.md"
check_dir "app/(public)"
check_dir "src/app"
check_dir "src/features"
check_dir "src/entities"
check_dir "src/shared"
check_file "src/features/example/README.md"
check_file "src/features/example/index.ts"
echo ""

# Test 2: Add feature with default segments
echo "🎯 Test 2: Add feature 'auth' with default segments"
node "$CLI_PATH" add:feature auth
check_result "Add feature command executed"

check_dir "src/features/auth"
check_file "src/features/auth/README.md"
check_file "src/features/auth/index.ts"
check_dir "src/features/auth/ui"
check_dir "src/features/auth/model"
check_dir "src/features/auth/api"
check_file "src/features/auth/ui/README.md"
check_file "src/features/auth/model/README.md"
check_file "src/features/auth/api/README.md"
echo ""

# Test 3: Add feature with custom segments
echo "🎯 Test 3: Add feature 'profile' with custom segments (ui,lib)"
node "$CLI_PATH" add:feature profile --segments ui,lib
check_result "Add feature with custom segments executed"

check_dir "src/features/profile"
check_dir "src/features/profile/ui"
check_dir "src/features/profile/lib"

# Should NOT have these
if [ -d "src/features/profile/model" ]; then
    echo -e "${RED}✗ Unexpected directory: src/features/profile/model${NC}"
    exit 1
fi
if [ -d "src/features/profile/api" ]; then
    echo -e "${RED}✗ Unexpected directory: src/features/profile/api${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Only specified segments created${NC}"
echo ""

# Test 4: Add entity with default segments
echo "🧱 Test 4: Add entity 'user' with default segments"
node "$CLI_PATH" add:entity user
check_result "Add entity command executed"

check_dir "src/entities/user"
check_file "src/entities/user/README.md"
check_file "src/entities/user/index.ts"
check_dir "src/entities/user/model"
check_dir "src/entities/user/ui"
echo ""

# Test 5: Add entity with custom segments
echo "🧱 Test 5: Add entity 'campaign' with custom segments (model)"
node "$CLI_PATH" add:entity campaign --segments model
check_result "Add entity with custom segments executed"

check_dir "src/entities/campaign"
check_dir "src/entities/campaign/model"

if [ -d "src/entities/campaign/ui" ]; then
    echo -e "${RED}✗ Unexpected directory: src/entities/campaign/ui${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Only specified segments created${NC}"
echo ""

# Test 6: Try to create duplicate feature (should skip files)
echo "⚠️  Test 6: Try to create duplicate feature 'auth'"
node "$CLI_PATH" add:feature auth
check_result "Duplicate feature command executed (should skip)"
echo ""

# Test 7: Invalid feature name
echo "❌ Test 7: Try to create feature with invalid name (should fail)"
set +e  # Temporarily disable exit on error
node "$CLI_PATH" add:feature InvalidName 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${RED}✗ Should have failed with invalid name${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Correctly rejected invalid name${NC}"
fi
set -e
echo ""

# Test 8: Check file content
echo "📄 Test 8: Verify file contents"
if grep -q "Feature: auth" "src/features/auth/README.md"; then
    echo -e "${GREEN}✓ Feature README contains correct title${NC}"
else
    echo -e "${RED}✗ Feature README missing correct title${NC}"
    exit 1
fi

if grep -q "Public API" "src/features/auth/index.ts"; then
    echo -e "${GREEN}✓ Feature index.ts contains public API comment${NC}"
else
    echo -e "${RED}✗ Feature index.ts missing public API comment${NC}"
    exit 1
fi

if grep -q "Entity: user" "src/entities/user/README.md"; then
    echo -e "${GREEN}✓ Entity README contains correct title${NC}"
else
    echo -e "${RED}✗ Entity README missing correct title${NC}"
    exit 1
fi
echo ""

# Test 9: List created structure
echo "🌳 Test 9: Project structure"
echo ""
tree -L 3 -I 'node_modules' || ls -R
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Test directory: $TEST_DIR"
echo "You can inspect it manually if needed."
echo ""
echo "To cleanup: rm -rf $TEST_DIR"
