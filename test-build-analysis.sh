#!/bin/bash
# test-build-analysis.sh - Layer 1: Build-Time Analysis

echo "🔍 LAYER 1: BUILD-TIME ANALYSIS"
echo "================================"

# Clean build
rm -rf .next
echo "📦 Starting fresh build..."

# Capture build output
npm run build 2>&1 | tee build-output.log

# Analyze static vs dynamic pages
echo -e "\n📊 PAGE RENDERING ANALYSIS:"
echo "Static Pages (○):"
grep "○" build-output.log | grep -v "api" || echo "  None found"

echo -e "\nDynamic Pages (ƒ):"
grep "ƒ" build-output.log | grep -v "api" || echo "  None found"

# Check for unexpected static pages
CRITICAL_DYNAMIC_PAGES=("/about" "/admin" "/account")
echo -e "\n⚠️  CRITICAL PAGE VALIDATION:"

for page in "${CRITICAL_DYNAMIC_PAGES[@]}"; do
    if grep -q "○.*$page" build-output.log; then
        echo "❌ CRITICAL: $page is static but should be dynamic!"
        exit 1
    else
        echo "✅ $page is properly dynamic"
    fi
done

# Check for build-time errors
if grep -q "Error fetching app settings" build-output.log; then
    echo "⚠️  WARNING: Database calls failing during build"
    grep "Error fetching app settings" build-output.log
fi

echo -e "\n✅ Build analysis complete"
