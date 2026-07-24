#!/usr/bin/env bash
# verify.sh — exercises every sprint's core functionality against a running API.
# Usage: ./verify.sh   (run from repo root, with the API already started on :4000)
API=http://localhost:4000/api/v1
FAIL=0
CURL="curl -s --max-time 5"

check() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  OK   $desc"
  else
    echo "  FAIL $desc (expected '$expected', got '$actual')"
    FAIL=1
  fi
}

jget() {
  # $1 = json string, $2 = property name. Prints EMPTY on any parse failure
  # instead of crashing the script (e.g. when the API returned an error body
  # because the database isn't connected).
  node -e "try{const d=JSON.parse(process.argv[1]);console.log(d[process.argv[2]] ?? 'EMPTY')}catch(e){console.log('EMPTY')}" "$1" "$2" 2>/dev/null
}

echo "== 0. Health & CORS (runtime fix) — no database required =="
STATUS=$($CURL -o /dev/null -w "%{http_code}" http://localhost:4000/health)
check "GET /health" 200 "$STATUS"

STATUS=$($CURL -o /dev/null -w "%{http_code}" -X OPTIONS "$API/organizations" \
  -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET")
check "OPTIONS preflight (was 401 before the fix, should be 204)" 204 "$STATUS"

echo "== 1. Auth — no database required (dev-token signs a fixed dev user, doesn't query anything) =="
TOKEN_RESPONSE=$($CURL -X POST "$API/auth/dev-token")
TOKEN=$(jget "$TOKEN_RESPONSE" accessToken)
if [ "$TOKEN" = "EMPTY" ]; then
  echo "  FAIL could not get dev token — is NODE_ENV=production set? dev-token is disabled there."
  echo "  Cannot continue further checks without a token."
  exit 1
fi
echo "  OK   token acquired"
AUTH="Authorization: Bearer $TOKEN"

STATUS=$($CURL -o /dev/null -w "%{http_code}" "$API/organizations/t1")
check "GET org without token still rejected (auth enforcement intact)" 401 "$STATUS"

echo ""
echo "== From here on, every check needs a live Postgres. Testing connectivity first. =="
PROBE=$($CURL -X POST "$API/signals" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"tenantId":"t1","orgId":"org1","source":"capability"}')
PROBE_ID=$(jget "$PROBE" id)

if [ "$PROBE_ID" = "EMPTY" ]; then
  echo "  NO DATABASE DETECTED — response was: $PROBE"
  echo ""
  echo "  Sprints 2-6 cannot be checked without a live Postgres + migrations applied."
  echo "  Run: npm run db:migrate   (see the guide for full setup), then re-run this script."
  echo ""
  echo "  Confirmed working without a database: Sprint 1 CORS fix, auth token issuance, auth enforcement."
  exit 1
fi

SIGNAL_ID="$PROBE_ID"
echo "  OK   database is connected — signal created: $SIGNAL_ID"

echo "== 2. Sprint 2: Signal -> Evidence -> Reasoning -> Recommendation chain =="
$CURL -X POST "$API/evidence" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"signalId\":\"$SIGNAL_ID\",\"source\":\"internal\",\"content\":{\"note\":\"2 territories won\"},\"provenance\":{},\"confidence\":0.9}" > /dev/null
echo "  OK   evidence attached"

REASONING=$($CURL -X POST "$API/reasoning" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"signalId\":\"$SIGNAL_ID\",\"description\":\"verification test\"}")
STEP_ID=$(jget "$REASONING" id)
CONFIDENCE=$(jget "$REASONING" confidenceScore)
echo "  OK   reasoning step created: $STEP_ID, confidence=$CONFIDENCE (should be > 0.3 base since evidence was attached)"

REC=$($CURL -X POST "$API/recommendations" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"reasoningStepId\":\"$STEP_ID\",\"category\":\"opportunity\",\"title\":\"Verification recommendation\"}")
REC_ID=$(jget "$REC" id)
echo "  OK   recommendation created: $REC_ID"

echo "== 3. Sprint 3/4: Decision -> Executor Resolver (opportunity must resolve to human) =="
DECISION=$($CURL -X POST "$API/decisions" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"recommendationId\":\"$REC_ID\",\"rationale\":\"verification approval\"}")
EXEC_TYPE=$(jget "$DECISION" executorType)
DECISION_ID=$(jget "$DECISION" id)
check "opportunity category resolves to human executor" "human" "$EXEC_TYPE"

echo "== 4. Sprint 6: autonomous approval must NEVER fire for opportunity, even with a matching policy =="
$CURL -X POST "$API/policies" -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"tenantId":"t1","name":"Test auto-approve","scope":"recommendations","policyType":"business_rule","rules":[{"field":"recommendation.category","operator":"eq","value":"opportunity","action":"auto_approve"}]}' > /dev/null
REC2=$($CURL -X POST "$API/recommendations" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"reasoningStepId\":\"$STEP_ID\",\"category\":\"opportunity\",\"title\":\"Should never auto-approve\"}")
REC2_ID=$(jget "$REC2" id)
ATTEMPT=$($CURL -X POST "$API/decisions/t1/$REC2_ID/auto-approve-attempt" -H "$AUTH")
AUTO_APPROVED=$(jget "$ATTEMPT" autoApproved)
check "opportunity blocked from auto-approval despite matching policy" "false" "$AUTO_APPROVED"

echo "== 5. Sprint 5: Mental Model reinforcement =="
OUTCOME=$($CURL -X POST "$API/outcomes" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"decisionId\":\"$DECISION_ID\",\"result\":\"success\",\"confidence\":0.8}")
OUTCOME_ID=$(jget "$OUTCOME" id)
$CURL -X POST "$API/learnings" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"t1\",\"outcomeId\":\"$OUTCOME_ID\",\"domain\":\"verification-domain\",\"pattern\":\"verification pattern held\"}" > /dev/null
MODEL=$($CURL "$API/mental-models/t1/domain/verification-domain" -H "$AUTH")
REINFORCED=$(jget "$MODEL" domain)
check "mental model created for the domain" "verification-domain" "$REINFORCED"

echo ""
if [ "$FAIL" = "0" ]; then
  echo "ALL CHECKS PASSED"
else
  echo "SOME CHECKS FAILED — see FAIL lines above"
  exit 1
fi
