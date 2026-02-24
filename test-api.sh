#!/bin/bash

# AuthX Enterprise - API Testing Suite
# Tests all critical endpoints

echo "🧪 AuthX Enterprise - API Testing Suite"
echo "=========================================="
echo ""

API_URL="http://localhost:5000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local METHOD=$1
  local ENDPOINT=$2
  local DATA=$3
  local DESCRIPTION=$4
  
  echo -ne "${YELLOW}Testing:${NC} $DESCRIPTION... "
  
  if [ -z "$DATA" ]; then
    RESPONSE=$(curl -s -X $METHOD "$API_URL$ENDPOINT" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}")
  else
    RESPONSE=$(curl -s -X $METHOD "$API_URL$ENDPOINT" \
      -H "Content-Type: application/json" \
      -d "$DATA" \
      -w "\n%{http_code}")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [[ $HTTP_CODE == 200 ]] || [[ $HTTP_CODE == 201 ]] || [[ $HTTP_CODE == 400 ]] || [[ $HTTP_CODE == 401 ]]; then
    echo -e "${GREEN}✓${NC} (HTTP $HTTP_CODE)"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} (HTTP $HTTP_CODE)"
    ((FAILED++))
  fi
}

# ==================== HEALTH CHECK ====================
echo -e "${BLUE}━━━━ Health Check ━━━━${NC}"
test_endpoint "GET" "/v1/health" "" "API Health"
echo ""

# ==================== AUTHENTICATION ====================
echo -e "${BLUE}━━━━ Authentication Endpoints ━━━━${NC}"
test_endpoint "POST" "/v1/auth/register" '{"email":"test@authx.com","username":"testuser","password":"Test123!"}' "Register User"
test_endpoint "POST" "/v1/auth/login" '{"email":"test@authx.com","password":"Test123!"}' "Login"
test_endpoint "POST" "/v1/auth/forgot-password" '{"email":"test@authx.com"}' "Forgot Password"
echo ""

# ==================== CASES ENDPOINTS ====================
echo -e "${BLUE}━━━━ Case Management ━━━━${NC}"
test_endpoint "GET" "/v1/cases" "" "Get All Cases"
test_endpoint "POST" "/v1/cases" '{
  "acc_id":"TEST001",
  "customer_name":"John Doe",
  "phone_number":"9876543210",
  "address":"123 Main St",
  "lat":28.7041,
  "lng":77.1025,
  "pos_amount":100000,
  "overdue_amount":50000,
  "dpd":45,
  "bkt":"BKT-0",
  "product_type":"Agriculture",
  "bank_name":"HDFC"
}' "Create Case"
echo ""

# ==================== FEEDBACK ENDPOINTS ====================
echo -e "${BLUE}━━━━ Feedback & Geospatial ━━━━${NC}"
test_endpoint "GET" "/v1/feedbacks" "" "Get All Feedbacks"
test_endpoint "POST" "/v1/feedbacks" '{
  "caseId":"test-case-id",
  "lat":28.7050,
  "lng":77.1035,
  "visit_code":"V001",
  "meeting_place":"Office",
  "asset_status":"GOOD",
  "ptp_date":"2026-02-20",
  "remarks":"Visit successful"
}' "Submit Feedback"
test_endpoint "GET" "/v1/feedbacks/audit/fake-visits" "" "Audit Fake Visits"
echo ""

# ==================== PAYOUT ENDPOINTS ====================
echo -e "${BLUE}━━━━ Payout Grid Management ━━━━${NC}"
test_endpoint "GET" "/v1/payouts/grids" "" "Get Payout Grids"
test_endpoint "POST" "/v1/payouts/grids" '{
  "bank":"HDFC",
  "product":"Agriculture",
  "bkt":"BKT-0",
  "target_percent":90,
  "payout_type":"FIXED",
  "payout_amount":500,
  "norm_bonus":100,
  "rollback_bonus":150
}' "Create Payout Grid"
echo ""

# ==================== BLOG ENDPOINTS ====================
echo -e "${BLUE}━━━━ Blog Module ━━━━${NC}"
test_endpoint "GET" "/v1/blogs/published" "" "Get Published Posts"
test_endpoint "POST" "/v1/blogs" '{
  "title":"Test Post",
  "content":"This is a test blog post"
}' "Create Blog Post"
echo ""

# ==================== SUMMARY ====================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "Results: ${GREEN}$PASSED passed${NC} / ${RED}$FAILED failed${NC} (Total: $TOTAL)"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${YELLOW}⚠️  $FAILED test(s) failed - check server logs${NC}"
fi

echo ""
echo "📊 Useful Commands:"
echo "   Backend logs:  tail -f /tmp/backend.log"
echo "   Frontend logs: tail -f /tmp/frontend.log"
echo "   API Docs:      See API_DOCUMENTATION.md"
echo "   DB Studio:     npx prisma studio"
echo ""
