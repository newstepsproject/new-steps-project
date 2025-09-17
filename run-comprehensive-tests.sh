#!/bin/bash
# run-comprehensive-tests.sh - Master Test Runner

echo "🚀 COMPREHENSIVE TESTING FRAMEWORK"
echo "=================================="
echo "Running all 4 layers of testing..."
echo "Timestamp: $(date)"

# Make scripts executable
chmod +x test-build-analysis.sh
chmod +x test-data-flow-integration.py
chmod +x test-production-health.py

# Create results directory
mkdir -p test-results
cd test-results

# Layer 1: Build-Time Analysis
echo -e "\n🏗️  LAYER 1: BUILD-TIME ANALYSIS"
echo "================================"
../test-build-analysis.sh 2>&1 | tee layer1-build-analysis.log
LAYER1_EXIT_CODE=$?

if [ $LAYER1_EXIT_CODE -ne 0 ]; then
    echo "❌ Layer 1 FAILED - Critical build issues detected"
    echo "   Check layer1-build-analysis.log for details"
    echo "   Stopping tests - fix build issues first"
    exit 1
else
    echo "✅ Layer 1 PASSED - Build analysis successful"
fi

# Layer 2: Data Flow Integration
echo -e "\n🔄 LAYER 2: DATA FLOW INTEGRATION"
echo "=================================="
python3 ../test-data-flow-integration.py 2>&1 | tee layer2-data-flow.log
LAYER2_EXIT_CODE=$?

if [ $LAYER2_EXIT_CODE -ne 0 ]; then
    echo "❌ Layer 2 FAILED - Data flow issues detected"
    echo "   Check layer2-data-flow.log for details"
    echo "   Continuing to remaining layers..."
else
    echo "✅ Layer 2 PASSED - Data flow integration successful"
fi

# Layer 3: End-to-End Workflows (placeholder for now)
echo -e "\n👥 LAYER 3: END-TO-END WORKFLOWS"
echo "================================="
echo "⚠️  Layer 3 not yet implemented - would test:"
echo "   - Admin login → Settings change → User sees change"
echo "   - User registration → Shoe request → Admin processing"
echo "   - Donation submission → Admin processing → Inventory update"
echo "✅ Layer 3 SKIPPED - Implementation pending"

# Layer 4: Production Validation
echo -e "\n🌐 LAYER 4: PRODUCTION VALIDATION"
echo "=================================="
python3 ../test-production-health.py 2>&1 | tee layer4-production-health.log
LAYER4_EXIT_CODE=$?

if [ $LAYER4_EXIT_CODE -ne 0 ]; then
    echo "❌ Layer 4 FAILED - Production health issues detected"
    echo "   Check layer4-production-health.log for details"
else
    echo "✅ Layer 4 PASSED - Production health validation successful"
fi

# Generate summary report
echo -e "\n📊 COMPREHENSIVE TEST SUMMARY"
echo "============================="
echo "Timestamp: $(date)"
echo "Layer 1 (Build Analysis): $([ $LAYER1_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "Layer 2 (Data Flow): $([ $LAYER2_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "Layer 3 (Workflows): ⚠️  SKIPPED"
echo "Layer 4 (Production): $([ $LAYER4_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"

# Calculate overall success
TOTAL_LAYERS=3  # Excluding Layer 3 which is skipped
PASSED_LAYERS=0

[ $LAYER1_EXIT_CODE -eq 0 ] && PASSED_LAYERS=$((PASSED_LAYERS + 1))
[ $LAYER2_EXIT_CODE -eq 0 ] && PASSED_LAYERS=$((PASSED_LAYERS + 1))
[ $LAYER4_EXIT_CODE -eq 0 ] && PASSED_LAYERS=$((PASSED_LAYERS + 1))

SUCCESS_RATE=$((PASSED_LAYERS * 100 / TOTAL_LAYERS))

echo -e "\nOverall Success Rate: $SUCCESS_RATE% ($PASSED_LAYERS/$TOTAL_LAYERS layers passed)"

# Determine final status
if [ $SUCCESS_RATE -ge 100 ]; then
    echo "🎉 ALL TESTS PASSED - SYSTEM READY FOR DEPLOYMENT"
    FINAL_EXIT_CODE=0
elif [ $SUCCESS_RATE -ge 66 ]; then
    echo "⚠️  PARTIAL SUCCESS - REVIEW FAILED LAYERS BEFORE DEPLOYMENT"
    FINAL_EXIT_CODE=1
else
    echo "❌ CRITICAL FAILURES - DO NOT DEPLOY"
    FINAL_EXIT_CODE=1
fi

# Save summary to file
cat > test-summary.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "layers": {
    "layer1_build_analysis": {
      "status": "$([ $LAYER1_EXIT_CODE -eq 0 ] && echo "passed" || echo "failed")",
      "exit_code": $LAYER1_EXIT_CODE,
      "log_file": "layer1-build-analysis.log"
    },
    "layer2_data_flow": {
      "status": "$([ $LAYER2_EXIT_CODE -eq 0 ] && echo "passed" || echo "failed")",
      "exit_code": $LAYER2_EXIT_CODE,
      "log_file": "layer2-data-flow.log"
    },
    "layer3_workflows": {
      "status": "skipped",
      "exit_code": null,
      "log_file": null
    },
    "layer4_production": {
      "status": "$([ $LAYER4_EXIT_CODE -eq 0 ] && echo "passed" || echo "failed")",
      "exit_code": $LAYER4_EXIT_CODE,
      "log_file": "layer4-production-health.log"
    }
  },
  "summary": {
    "total_layers": $TOTAL_LAYERS,
    "passed_layers": $PASSED_LAYERS,
    "success_rate": $SUCCESS_RATE,
    "final_status": "$([ $FINAL_EXIT_CODE -eq 0 ] && echo "passed" || echo "failed")"
  }
}
EOF

echo -e "\n📄 Detailed results saved in test-results/ directory"
echo "   - test-summary.json: Overall test summary"
echo "   - layer*.log: Individual layer logs"
echo "   - production-health-*.json: Production health details"

cd ..
exit $FINAL_EXIT_CODE
