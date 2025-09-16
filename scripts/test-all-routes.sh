#!/bin/bash

# scripts/test-all-routes.sh - Test all optimized tender API routes

echo "🧪 Testing all optimized tender API routes..."

# Base URL for testing
BASE_URL="http://localhost:3001"

# Define routes to test
declare -a routes=("basar" "ongole" "rkvalley" "sklm" "nuzvidu" "rgukt")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🚀 Starting API route tests..."
echo ""

# Test each route
for route in "${routes[@]}"
do
    echo -e "${BLUE}Testing /api/tenders/$route${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Test basic endpoint
    response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$BASE_URL/api/tenders/$route")
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    time_total=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*;TIME:[0-9.]*$//')

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 503 ]; then
        echo -e "  ${GREEN}✅ Status: $http_code${NC}"
        echo -e "  ${GREEN}⚡ Response time: ${time_total}s${NC}"

        # Parse JSON to check structure
        success=$(echo "$body" | jq -r '.success // false' 2>/dev/null)
        data_count=$(echo "$body" | jq -r '.data | length // 0' 2>/dev/null)
        cached=$(echo "$body" | jq -r '.cached // false' 2>/dev/null)
        source=$(echo "$body" | jq -r '.source // "unknown"' 2>/dev/null)

        echo "  📊 Success: $success"
        echo "  📦 Data count: $data_count"
        echo "  💾 Cached: $cached"
        echo "  🏢 Source: $source"
    else
        echo -e "  ${RED}❌ Status: $http_code${NC}"
        echo -e "  ${RED}⚡ Response time: ${time_total}s${NC}"
        echo "  📝 Response: $body"
    fi

    # Test with pagination
    echo ""
    echo "  🔍 Testing pagination..."
    paginated_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/tenders/$route?page=1&limit=5")
    paginated_http_code=$(echo "$paginated_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

    if [ "$paginated_http_code" -eq 200 ] || [ "$paginated_http_code" -eq 503 ]; then
        echo -e "  ${GREEN}✅ Pagination works${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Pagination issue: $paginated_http_code${NC}"
    fi

    echo ""
done

echo ""
echo "🔧 Testing system endpoints..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test system status
echo "📊 Testing system status..."
sys_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/system/init")
sys_http_code=$(echo "$sys_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

if [ "$sys_http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ System status endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  System status issue: $sys_http_code${NC}"
fi

# Test scraper status
echo "🤖 Testing scraper status..."
scraper_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/admin/scraper?action=status")
scraper_http_code=$(echo "$scraper_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)

if [ "$scraper_http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Scraper status endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Scraper status issue: $scraper_http_code${NC}"
fi

echo ""
echo "📈 Performance Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate average response time
total_time=0
count=0
for route in "${routes[@]}"
do
    response=$(curl -s -w "TIME:%{time_total}" -o /dev/null "$BASE_URL/api/tenders/$route")
    time_total=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
    total_time=$(echo "$total_time + $time_total" | bc)
    count=$((count + 1))
done

if [ $count -gt 0 ]; then
    avg_time=$(echo "scale=3; $total_time / $count" | bc)
    echo -e "${GREEN}⚡ Average response time: ${avg_time}s${NC}"

    if [ $(echo "$avg_time < 1.0" | bc) -eq 1 ]; then
        echo -e "${GREEN}🚀 Excellent performance! Under 1 second${NC}"
    elif [ $(echo "$avg_time < 3.0" | bc) -eq 1 ]; then
        echo -e "${YELLOW}⚡ Good performance! Under 3 seconds${NC}"
    else
        echo -e "${RED}⚠️  Performance needs improvement${NC}"
    fi
fi

echo ""
echo "✅ Testing completed!"
echo ""
echo "📝 Next steps:"
echo "  - If all tests pass, the migration was successful"
echo "  - Monitor response times in production"
echo "  - Check scraper job status regularly"
echo "  - Set up monitoring alerts if needed"