# ✅ Coordinator Agent Verification

## What It Does
**NGO Request → Supply Agent → Match Created → Restaurant Notified → Dispatch Triggered**

## Complete Test Flow

### Step 1: Create NGO Request
- Go to: `http://localhost:3000/ngo/request`
- Fill: "Need 50 meals"
- Click: Submit
- Expected: Request saved with status: `pending`

### Step 2: Create Donor Listing (Triggers Coordinator)
- Go to: `http://localhost:3000/donor`
- Upload food photo → AI scan
- Enter address → "Confirm Donation"
- **CRITICAL**: This calls `/api/agents/coordinator/match-listing`
- Expected: Coordinator finds NGO request and creates Match

### Step 3: Verify Match Created
Check Firestore collection `matches`:
```
{
  requestId: "ngo_request_id",
  listingId: "donor_listing_id",
  status: "pending_approval",
  restaurantId: "donor_user_id",
  ngoId: "ngo_user_id"
}
```

### Step 4: Restaurant Approves
- See notification: "Food request matched!"
- Click: "Approve"
- Expected:
  - Match → `approved`
  - Request → `approved`
  - Dispatch triggered
  - NGO notified

## Coordinator Agent Code Flow

### Main Function: `runCoordinatorAgent(request)`

**Steps**:
1. Log: "receive_request" decision
2. Call Supply Agent: find best listing
   - Filter: not expired + enough servings
   - Score: expiry time + serving amount
   - Return: highest scoring listing
3. If no listing:
   - Log: "no_supply_found"
   - Update request: `status = "failed"`
   - Notify NGO: "No supply found"
   - Return: null
4. Create Match with:
   - `status = "pending_approval"`
   - `slaDeadline = now + 5 minutes`
5. Lock resources:
   - Listing: `status = "pending"`
   - Request: `status = "matched"`
6. Notify restaurant (in-app + WhatsApp)
7. Notify NGO (in-app + WhatsApp)
8. Check auto-approve setting
   - If YES: call `handleRestaurantApproval()`
   - If NO: wait for manual approval

### Handle Approval: `handleRestaurantApproval(matchId, approved)`

**If Rejected**:
- Match: `status = "rejected"`
- Listing: `status = "available"` (unlock)
- Request: `status = "pending"` (re-queue)
- Escalation Agent: try next match

**If Approved**:
- Match: `status = "approved"`
- Request: `status = "approved"`
- Notify NGO: "Approved! Volunteer being assigned"
- Dispatch Agent: assign volunteer

## Firestore Collections Required

✅ `requests` - NGO food requests
✅ `listings` - Donor food surplus
✅ `matches` - Coordinator match results
✅ `deliveries` - Dispatch assignments
✅ `notifications` - User alerts
✅ `decisions` - Agent decision logs

## Testing Scenarios

### ✅ Scenario 1: Basic Match
1. NGO requests 50 meals
2. Donor lists 100 servings
3. Coordinator creates match
4. Restaurant approves
5. Dispatch assigns volunteer
**Result**: ✅ Success

### ❌ Scenario 2: Insufficient Supply
1. NGO requests 100 meals
2. Donor lists only 20 servings
3. Coordinator skips (needs 80+ match)
4. NGO notified: "No supply found"
**Result**: ✅ Expected behavior

### ✅ Scenario 3: Expired Food Skip
1. NGO requests 50 meals
2. Donor lists 100 (expiring in 10 min)
3. Coordinator considers but scores lower
4. Waits for fresher food
**Result**: ✅ Prefers fresh food

### ✅ Scenario 4: Auto-Approve
1. Restaurant has `autoApprove: true`
2. Coordinator creates match
3. Auto-approves without manual step
4. Dispatch immediately triggered
**Result**: ✅ Instant processing

### ✅ Scenario 5: Restaurant Rejects
1. Match created (pending_approval)
2. Restaurant clicks "Decline"
3. Listing unlocked, request re-queued
4. Escalation tries next restaurant
**Result**: ✅ Resilience

## Debugging Checklist

- [ ] NGO request exists in Firestore `requests`
- [ ] Donor listing exists in Firestore `listings`
- [ ] Match appears in Firestore `matches` after donation
- [ ] Notifications sent to restaurant and NGO
- [ ] Match status transitions: pending → approved
- [ ] Dispatch triggered after approval
- [ ] WhatsApp messages sent (if configured)

## Troubleshooting

**Match not created?**
1. Check: Are there pending NGO requests?
   ```
   Firestore → requests → filter: status = "pending"
   ```
2. Check: Can Supply Agent find available listings?
   ```
   Firestore → listings → filter: status = "available"
   ```
3. Check server logs:
   ```
   npm run dev  # look for [coordinator] errors
   ```

**Restaurant not notified?**
1. Check Firestore `notifications` collection
2. Verify `createNotification()` function works
3. Check WhatsApp API configuration

**Dispatch not triggered?**
1. Verify match status is actually "approved"
2. Check Firestore `deliveries` collection
3. Look for Dispatch Agent errors in logs

## Quick Verification Steps

```bash
# 1. Start with logs
npm run dev

# 2. In browser:
# - Create NGO request (/ngo/request)
# - Create Donor listing (/donor)
# - Check Firestore for match

# 3. In Firestore Console:
# - Check matches collection (should exist)
# - Check notifications (should have entries)
# - Check decisions log (coordinator logs)

# 4. Verify restaurant approval:
# - Look for approval notification
# - Check match status changes to "approved"
# - Verify delivery created
```

## Success Metrics

✅ Coordinator is working if:
- Match created within 5 seconds
- Restaurant notified instantly
- NGO notified instantly
- Match status transitions correctly
- Dispatch triggered on approval
- WhatsApp alerts sent (if enabled)

EOF
