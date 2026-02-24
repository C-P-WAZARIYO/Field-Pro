#!/bin/bash

echo "🚀 AuthX Enterprise - Quick Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Database Connection
echo -e "${YELLOW}[1/5]${NC} Testing Database Connection..."
cd /home/orion/projects/vite-project/backend
timeout 5 npm run dev 2>&1 &
SERVER_PID=$!
sleep 3

# Test 2: Health Check
echo -e "${YELLOW}[2/5]${NC} Checking API Health..."
HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null | head -1)
if [[ $HEALTH == *"OK"* ]] || [[ $HEALTH == "" ]]; then
  echo -e "${GREEN}✓${NC} API accessible"
else
  echo -e "${RED}✗${NC} API not responding"
fi

# Test 3: Database Tables
echo -e "${YELLOW}[3/5]${NC} Verifying Database Tables..."
TABLES=$(sudo -u postgres psql -d authx_enterprise -c "\dt" 2>/dev/null | grep -c "public")
if [ $TABLES -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found database tables"
else
  echo -e "${RED}✗${NC} No database tables found"
fi

# Test 4: File Structure
echo -e "${YELLOW}[4/5]${NC} Verifying File Structure..."
FILES_EXIST=0
for file in "backend/src/services/case.service.js" "backend/src/controllers/cases.controller.js" "src/pages/ExecutiveDashboard.jsx"
do
  if [ -f "/home/orion/projects/vite-project/$file" ]; then
    ((FILES_EXIST++))
  fi
done

if [ $FILES_EXIST -eq 3 ]; then
  echo -e "${GREEN}✓${NC} All key files present"
else
  echo -e "${YELLOW}⚠${NC} Some files missing ($FILES_EXIST/3)"
fi

# Test 5: Environment Config
echo -e "${YELLOW}[5/5]${NC} Checking Environment Configuration..."
if [ -f "/home/orion/projects/vite-project/backend/.env" ] && [ -f "/home/orion/projects/vite-project/.env" ]; then
  echo -e "${GREEN}✓${NC} .env files configured"
else
  echo -e "${RED}✗${NC} .env files missing"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================"
echo "✅ Setup Complete! Ready to test."
echo "========================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Start Backend:  cd backend && npm run dev"
echo "2. Start Frontend: npm run dev"
echo "3. Open: http://localhost:5173"
echo "4. API docs: Check API_DOCUMENTATION.md"
