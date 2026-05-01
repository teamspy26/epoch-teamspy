# 🤖 Multi-Agent System Architecture

## System Overview

```
NGO Request → Demand Agent → Coordinator → Supply Agent → Restaurant → Dispatch → Volunteer → Delivery
                    ↓                            ↓                ↓
                Queue & Rank            Message Bus & Audit    Expiry Alerts
```

## Agent Responsibilities

### 1. **Demand Agent** — Queue & Prioritize
**File**: `src/lib/agents/demand.ts`

**Responsibilities**:
- ✅ Queue NGO food requests
- ✅ Rank by: urgency (50%), beneficiary count (30%), time (20%)
- ✅ Split large requests across multiple suppliers
- ✅ Send confirmation to NGO
- ✅ Track fulfillment rate per NGO
- ✅ Calculate priority score for each request

**Key Functions**:
```typescript
runDemandAgent(request)           // Queue new request
rankPendingRequests()              // Score & rank all pending
shouldSplitRequest(servings)       // Determine if multi-supplier
trackFulfillmentRate(ngoId)        // Get NGO fulfillment stats
sendConfirmationToNGO()            // Send updates to NGO
```

**Audit Trail Logged**:
- Request queued
- Priority ranking
- Confirmation sent
- Fulfillment tracking

---

### 2. **Supply Agent** — Real-time Inventory & Matching
**File**: `src/lib/agents/supply.ts`

**Responsibilities**:
- ✅ Monitor real-time food inventory
- ✅ Track expiry times with auto-alerts
- ✅ Match NGO needs to nearest surplus
- ✅ Ping restaurant managers for urgent requests
- ✅ Score matches: freshness (40%), servings (30%), distance (20%), urgency (10%)

**Expiry Alert Thresholds**:
- 🚨 < 30 mins: URGENT (status = "urgent", WhatsApp + notification)
- ⚠️ 30 min - 2 hrs: HIGH PRIORITY (status = "high_priority")
- 📌 2-4 hrs: MEDIUM PRIORITY (status = "medium_priority")

**Key Functions**:
```typescript
findBestSupplyMatch(request)       // Score & find best listing
monitorInventoryExpiryAlerts()     // Check all listings for expiry
pingRestaurantManagerForUrgent()   // Alert for critical requests
calculateDistance(lat, lon)        // Haversine formula for proximity
```

**Audit Trail Logged**:
- Match found (with score breakdown)
- Expiry alerts sent
- Urgent pings sent
- Distance calculations

---

### 3. **Coordinator Agent** — Orchestration & Audit
**File**: `src/lib/agents/coordinator.ts`

**Responsibilities**:
- ✅ Receive all requests
- ✅ Decide which agents to activate (Supply, Demand, Dispatch, Escalation)
- ✅ Route NGO requests to best supply matches
- ✅ Manage agent-to-agent message bus
- ✅ Handle timeouts (5 min SLA)
- ✅ Escalate failures
- ✅ Complete audit trail with timestamps

**Agent Message Bus**:
```typescript
messageBus.send(from, to, type, payload)     // Send message
messageBus.receive(agentName, type)          // Get messages
messageBus.markProcessed(messageId)          // Confirm processing
```

**SLA & Escalation**:
- 5 minute approval deadline
- If pending after SLA → escalate to Escalation Agent
- Rejection → unlock listing, re-queue request
- Approval → trigger Dispatch Agent

**Key Functions**:
```typescript
runCoordinatorAgent(request)           // Main orchestration
handleRestaurantApproval(approved)     // Process approval/rejection
setupTimeoutEscalation(matchId)        // SLA monitoring
createMatchWithAudit()                 // Create match with trail
handleNoSupply()                       // Escalate no-supply case
```

**Audit Trail Format**:
```json
{
  "step": "request_received",
  "time": 0,
  "timestamp": "2026-05-02T10:30:00Z"
}
```

---

## Complete Data Flow

### Step 1: NGO Creates Request
```
NGO: "I need 50 meals for 100 people, URGENT"
        ↓
Demand Agent:
  - Validate request
  - Calculate priority score (urgency: 100%, beneficiaries: 100%, time: 0%)
  - Check if needs splitting (50 meals < 100 max per supplier → no split)
  - Create request in Firestore
  - Send confirmation to NGO
  - Log: "request_queued"
        ↓
Firestore: requests collection
  {
    id: "req_123",
    status: "pending",
    ngoId: "ngo_001",
    servingsNeeded: 50,
    urgency: "critical",
    beneficiaryCount: 100
  }
```

### Step 2: Coordinator Activates Supply Agent
```
Coordinator:
  - Receive request
  - Log: "receive_request"
  - Send message to Supply Agent: "find_match"
        ↓
Supply Agent:
  - Get all available listings
  - Filter: not expired + 50+ servings
  - Score each match:
    * Freshness (1-4 hrs ideal = 1.0)
    * Servings (40+ = close to 1.0)
    * Distance (nearby = higher score)
    * Urgency fit (critical = 0.3 boost)
  - Sort by score
  - Return best match
  - Log: "match_found", score: 0.92
        ↓
Best Match: Restaurant XYZ, 100 servings, 2 hrs expiry
```

### Step 3: Urgent Ping for Critical Requests
```
Supply Agent (for urgent requests):
  - Send WhatsApp to restaurant manager:
    "🚨 URGENT: NGO needs 50 meals NOW for 100 people!"
  - Send in-app notification: "URGENT Food Request"
  - Log: "urgent_ping_sent"
        ↓
Restaurant Manager: Gets pinged immediately
```

### Step 4: Match Created with Audit Trail
```
Coordinator:
  - Create Match document:
    {
      id: "match_456",
      requestId: "req_123",
      listingId: "list_789",
      status: "pending_approval",
      slaDeadline: now + 5 minutes
    }
  - Update request: status = "matched"
  - Update listing: status = "pending"
  - Send to NGO: "Match found! Waiting for approval"
  - Send to Restaurant: "Urgent request needs your approval"
  - Setup 5-minute timeout
  - Log audit trail:
    [
      {step: "request_received", time: 5ms},
      {step: "supply_agent_executed", time: 150ms},
      {step: "match_created_in_firestore", time: 200ms},
      {step: "notifications_sent", time: 220ms}
    ]
```

### Step 5: Restaurant Approval → Dispatch Triggered
```
Restaurant Manager: Clicks "Approve"
        ↓
Coordinator.handleRestaurantApproval(approved=true):
  - Update match: status = "approved"
  - Update request: status = "approved"
  - Send to NGO: "✅ Approved! Volunteer assigned"
  - Call Dispatch Agent
  - Log: "approval_processed"
        ↓
Dispatch Agent:
  - Find best volunteer
  - Create delivery
  - Assign volunteer
  - Send route to volunteer
```

### Step 6: If Restaurant Rejects
```
Restaurant Manager: Clicks "Decline"
        ↓
Coordinator.handleRestaurantApproval(approved=false, reason):
  - Update match: status = "rejected"
  - Update listing: status = "available" (unlock)
  - Update request: status = "pending" (re-queue)
  - Call Escalation Agent
  - Log: "rejection_escalated"
        ↓
Escalation Agent:
  - Find next best match
  - Try again
  - If 3 rejections → admin alert
```

### Step 7: SLA Breach (5 mins, no response)
```
5 minutes pass, restaurant hasn't responded
        ↓
Coordinator (timeout):
  - Check match status (still "pending_approval")
  - Call Escalation Agent
  - Log: "sla_breach"
        ↓
Escalation Agent:
  - Send follow-up WhatsApp to restaurant
  - If no response → mark as SLA breach
  - Find alternate supplier
  - Or escalate to admin
```

---

## Audit Trail Implementation

### Every Decision Logged
```typescript
await logAgentDecision(agentName, action, details);
```

### Firestore Collection: `decisions`
```json
{
  "id": "decision_123",
  "agent": "coordinator",
  "action": "match_created",
  "timestamp": Timestamp,
  "details": {
    "matchId": "match_456",
    "requestId": "req_123",
    "listingId": "list_789",
    "auditTrail": [
      {step: "request_received", time: 5},
      {step: "supply_agent_executed", time: 150}
    ],
    "totalTime": 220
  }
}
```

### Complete Audit Trail Per Request
```
req_123 audit trail:
  ├─ 2026-05-02 10:30:00 - Demand: request_queued
  ├─ 2026-05-02 10:30:05 - Coordinator: receive_request
  ├─ 2026-05-02 10:30:15 - Supply: match_found (score: 0.92)
  ├─ 2026-05-02 10:30:16 - Supply: urgent_ping_sent
  ├─ 2026-05-02 10:30:20 - Coordinator: match_created
  ├─ 2026-05-02 10:30:21 - MessageBus: message_sent (to Supply)
  ├─ 2026-05-02 10:31:45 - Coordinator: approval_received (approved)
  ├─ 2026-05-02 10:31:50 - Dispatch: delivery_created
  └─ 2026-05-02 10:35:00 - Delivery: completed
```

---

## Message Bus Communication

### Agent-to-Agent Messages
```
Coordinator → Supply:  "find_match" {request}
Supply → Coordinator:  "match_found" {listing, score}

Coordinator → Dispatch: "assign_delivery" {match}
Dispatch → Coordinator: "delivery_assigned" {deliveryId, volunteerId}

Coordinator → Escalation: "no_supply_found" {request}
Escalation → Coordinator: "retry_escalation_queued" {escalationId}
```

### Message Bus Functions
```typescript
// Send message from coordinator to supply agent
await messageBus.send(
  "coordinator",
  "supply",
  "find_match",
  { requestId, request }
);

// Supply agent checks for messages
const messages = await messageBus.receive("supply", "find_match");

// After processing
await messageBus.markProcessed(message.id);
```

---

## Monitoring & Alerts

### Real-time Inventory Monitoring
```
Every 5 minutes:
  Supply Agent.monitorInventoryExpiryAlerts()
    → Check all listings
    → <30min: URGENT alert
    → 30min-2hr: HIGH PRIORITY alert
    → 2-4hr: MEDIUM PRIORITY alert
```

### Metrics Tracked
- **Per NGO**: Fulfillment rate, avg wait time, avg servings received
- **Per Restaurant**: Listing frequency, approval rate, response time
- **Per Volunteer**: Deliveries completed, avg response time
- **System**: Total matches, fulfillment rate, avg match time

---

## Error Handling & Escalation

### Escalation Triggers
1. **No supply found** → Escalation Agent searches alternatives
2. **Restaurant rejects** → Try next supplier
3. **SLA breach (5 min)** → Send reminder, escalate to admin
4. **3+ rejections** → Escalate to admin, notify NGO of delays
5. **Volunteer no-show** → Reassign volunteer, extend deadline

### Fallback Logic
```
Primary Match → No approval → Secondary Match
                   ↓
              (after 2 min)
                   ↓
          Escalation Agent
                   ↓
        Find next best match
                   ↓
         Repeat (max 3 times)
                   ↓
       If still no match → Admin alert
```

---

## Testing the System

### Test Scenario 1: Happy Path
```bash
1. Create NGO request: "Need 50 meals, URGENT"
2. Create donor listing: "100 servings, fresh"
3. ✅ Coordinator creates match
4. ✅ Restaurant gets urgent ping
5. ✅ Restaurant approves immediately
6. ✅ Dispatch triggers
7. ✅ Volunteer accepts
8. ✅ Delivery completed
```

### Test Scenario 2: Escalation
```bash
1. Create NGO request: "Need 50 meals"
2. Create donor listing: "100 servings"
3. ✅ Match created
4. ❌ Restaurant rejects
5. ✅ Request re-queued
6. ✅ Escalation Agent finds next match
7. ✅ Second restaurant approves
8. ✅ Delivery proceeds
```

### Test Scenario 3: SLA Breach
```bash
1. Create NGO request
2. Create donor listing
3. ✅ Match created
4. ⏳ Wait 5 minutes (no approval)
5. ✅ Timeout triggers
6. ✅ Escalation Agent notified
7. ✅ Follow-up sent to restaurant
8. ✅ Alternative search initiated
```

---

## Configuration

**SLA Settings**:
- Match approval deadline: **5 minutes**
- Escalation check interval: **1 minute**
- Max retries: **3 attempts**
- Expiry alert thresholds: **30 min, 2 hrs, 4 hrs**

**Distance Optimization**:
- Max service radius: **50 km**
- Geographic weighting: **20%**

**Priority Weighting**:
- Urgency: **50%**
- Beneficiary count: **30%**
- Request age: **20%**

---

## Success Metrics

✅ **Match Creation Time**: < 1 second
✅ **Notification Delivery**: < 5 seconds
✅ **Approval Response Time**: < 5 minutes (SLA)
✅ **Escalation Handling**: < 1 minute
✅ **Audit Trail**: 100% of decisions logged
✅ **Error Recovery**: Auto-escalation on failures
✅ **NGO Fulfillment**: > 80% matched requests
✅ **Restaurant Response**: > 70% within SLA

