# SLA Monitoring Setup Guide

## Overview
The system uses Firestore deadlines + scheduled cron checks for reliable SLA enforcement. This replaces the old `setTimeout` approach which fails in serverless environments.

## How It Works

### Step 1: Match Creation (Coordinator Agent)
When a match is created, the SLA deadline is stored in Firestore:
```typescript
{
  matchId: "match_123",
  status: "pending_approval",
  slaDeadline: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)) // 5 minutes from now
}
```

### Step 2: Periodic Monitoring (Cron Job)
A cron service (Google Cloud Scheduler or external) calls:
```
POST /api/cron/sla-monitor
Authorization: Bearer CRON_SECRET
```

This endpoint:
1. Queries all matches with `status = "pending_approval"` and `slaDeadline <= now`
2. Triggers escalation for each breached match
3. Logs the SLA breach in audit trail

### Step 3: Escalation (Escalation Agent)
When SLA is breached:
- Restaurant gets follow-up WhatsApp reminder
- Admin gets escalation notification
- System searches for alternate supplier
- NGO is notified of delay

---

## Configuration

### Environment Variables
Add to `.env.local`:
```env
CRON_SECRET=your-super-secret-cron-key-here
NEXT_PUBLIC_BASE_URL=https://your-domain.com  # for internal API calls during cron
```

### Google Cloud Scheduler Setup

1. **Create Cloud Function** (optional, for monitoring):
   ```bash
   # Deploy monitoring function
   gcloud functions deploy sla-monitor --runtime=nodejs18 --trigger-http
   ```

2. **Create Scheduled Job**:
   ```bash
   gcloud scheduler jobs create http sla-monitor-1min \
     --schedule="*/1 * * * *" \
     --uri="https://your-domain.com/api/cron/sla-monitor" \
     --http-method=POST \
     --headers="Authorization=Bearer YOUR_CRON_SECRET"
   ```

3. **Verify Job**:
   ```bash
   gcloud scheduler jobs describe sla-monitor-1min
   gcloud scheduler jobs run sla-monitor-1min  # Test run
   ```

### Manual Cron Service (External)
If not using Cloud Scheduler, use services like:
- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/
- **AWS EventBridge**: AWS Lambda + EventBridge
- **Railway**: Cron service

Configure to POST to:
```
https://your-domain.com/api/cron/sla-monitor
Headers:
  Authorization: Bearer CRON_SECRET
```

---

## Monitoring & Debugging

### Check Recent SLA Breaches
```bash
# In Firestore Console:
# Collections → agent_logs → Filter where action = "sla_breach_escalated"
```

### View Match SLA Status
```bash
# In Firestore Console:
# Collections → matches → Check slaDeadline field vs current time
```

### Test SLA Monitor Endpoint
```bash
curl -X POST http://localhost:3000/api/cron/sla-monitor \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

---

## SLA Thresholds

| Metric | Value | Notes |
|--------|-------|-------|
| Match Approval Deadline | 5 minutes | From match creation |
| SLA Check Interval | 1 minute | How often cron runs |
| SLA Breach Check Delay | ≤ 60 seconds | Max delay in catching breach |
| Max Escalation Retries | 3 attempts | Try 3 alternate suppliers |

---

## Architecture Diagram

```
Match Created
  ├─ Store slaDeadline in Firestore
  └─ Return matchId to NGO/Restaurant

[5 minute wait]

Cron Job (every 1 minute)
  ├─ Query matches: status = "pending_approval" AND slaDeadline <= now
  └─ For each breached match:
       ├─ POST /api/agents/escalation (no_restaurant_response)
       ├─ Log decision: "sla_breach_escalated"
       └─ Escalation Agent searches for alternate supplier

Escalation Agent
  ├─ Send follow-up WhatsApp to restaurant
  ├─ Notify admin dashboard
  ├─ Create escalation record
  └─ Search for next best match (via Supply Agent)
```

---

## Testing Scenarios

### Test 1: Basic SLA Breach
1. Create NGO request
2. Create donor listing
3. Coordinator creates match (5-min SLA)
4. Wait 5+ minutes
5. Manually call `/api/cron/sla-monitor`
6. Verify escalation triggered ✅

### Test 2: Cron Job Reliability
1. Set up Cloud Scheduler to run every 1 minute
2. Create match
3. Check logs in Cloud Logging
4. Verify escalation within 60 seconds ✅

### Test 3: Multiple Breaches
1. Create 5 matches, don't approve any
2. Wait 5+ minutes
3. Call SLA monitor endpoint
4. Verify all 5 escalations triggered ✅

---

## Migration from setTimeout

**Old approach** (removed):
```typescript
setTimeout(async () => {
  // Escalate after 5 minutes
}, 5 * 60 * 1000);
```
❌ Problems: Doesn't work in serverless, no guarantee of execution

**New approach** (implemented):
```typescript
// Store deadline in Firestore
slaDeadline: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000))

// Periodic check via cron
POST /api/cron/sla-monitor  // Called every 1 minute
```
✅ Reliable, scalable, auditable

---

## Success Metrics

✅ SLA breaches caught within 60 seconds  
✅ Escalation triggered automatically  
✅ No request slips through without escalation  
✅ Audit trail logs all SLA events  
✅ Cron health monitoring available  
