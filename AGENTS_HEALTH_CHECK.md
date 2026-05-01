# 🤖 All Agents Health Check & Fix Guide

## Agents in Prasadam System

| Agent | Purpose | Status | Fix |
|-------|---------|--------|-----|
| **Voice Agent** | Speech → Text → AI → Speech | ⚠️ Failing | Check logs, Sarvam API key |
| **Coordinator Agent** | Orchestrates matches | ❓ Unknown | Need to test |
| **Supply Agent** | Finds best listing match | ❓ Unknown | Need to test |
| **Dispatch Agent** | Assigns volunteers | ❓ Unknown | Need to test |
| **Escalation Agent** | Handles SLA breaches | ❓ Unknown | Need to test |
| **Food Scan Agent** | Quality check photos | ✅ Working | Verified in screenshot |
| **Quality Check Agent** | Claude Vision API | ❓ Unknown | Need to test |
| **Prediction Agent** | ML-based surplus forecast | ❓ Unknown | Need to test |

## Current Issue: Voice Agent "Speech recognition failed"

### Root Causes to Check

1. **Sarvam API Key Invalid**
   - Check: `SARVAM_API_KEY` in `.env.local`
   - Should start with: `sk_`
   - Current: `sk_i7iha5ut_...`

2. **Audio Format Issues**
   - WebM codec: `audio/webm;codecs=opus`
   - Browser might not support correctly
   - Server receives but Sarvam rejects it

3. **Sarvam API Endpoint Down**
   - Check: https://api.sarvam.ai/speech-to-text
   - Test with curl:
   ```bash
   curl -H "api-subscription-key: YOUR_KEY" \
        -F "file=@test.wav" \
        -F "language_code=en-IN" \
        https://api.sarvam.ai/speech-to-text
   ```

4. **Network/CORS Issues**
   - Backend should handle, but worth checking
   - Check browser console for any network errors

## How to Debug Voice Agent

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Click microphone button
4. Look for any errors

### Step 2: Check Server Logs
```bash
npm run dev
# Watch terminal for [Voice] logs
```

### Step 3: Test Sarvam API Directly
```bash
# Test STT
curl -X POST https://api.sarvam.ai/speech-to-text \
  -H "api-subscription-key: YOUR_API_KEY" \
  -F "file=@audio.wav" \
  -F "language_code=en-IN" \
  -F "model=saarika:v2"

# Test TTS
curl -X POST https://api.sarvam.ai/text-to-speech \
  -H "api-subscription-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": ["Hello"],
    "target_language_code": "en-IN",
    "speaker": "meera",
    "pitch": 0,
    "pace": 1.0,
    "loudness": 1.5,
    "model": "bulbul:v1"
  }'
```

## Testing All Agents

### 1. Food Scan Agent (WORKING ✅)
- Go to: `/donor`
- Upload food photo
- Should see AI analysis
- ✅ Status: Working in screenshot

### 2. Voice Agent (FAILING ⚠️)
- Click 🎤 microphone button
- Speak: "Hello test"
- Should hear "Speech recognition failed"
- ❌ Issue: Sarvam API not responding

### 3. Coordinator Agent
- Donate food on Donor dashboard
- Should trigger automatic matching
- Test: Check if NGO gets notified

### 4. Supply Agent
- NGO clicks "Find Food"
- Should see best matches ranked
- Test: Does it show closest listings?

### 5. Dispatch Agent
- Volunteer accepts delivery
- Should auto-assign routes
- Test: Can volunteer see delivery route?

### 6. Escalation Agent
- Delivery goes over 4 hours
- Should escalate to admin
- Test: Admin gets alert

## Quick Fixes

### Fix 1: Verify Environment Variables
```bash
grep -E "SARVAM|OPENAI" .env.local
# Should show:
# SARVAM_API_KEY=sk_...
# OPENAI_API_KEY=sk-proj-...
```

### Fix 2: Restart Dev Server
```bash
# Kill existing process
npm run dev   # Fresh start with logs
```

### Fix 3: Check API Connectivity
```bash
# From project directory
node -e "
const key = process.env.SARVAM_API_KEY;
console.log('API Key exists:', !!key);
console.log('Key starts with sk_:', key?.startsWith('sk_'));
"
```

### Fix 4: Test Audio Format
Browser WebM might not be compatible.
Add WAV support fallback in voice-input.tsx.

## Agent Dependencies

```
Voice Agent
  └─ Sarvam STT API (external)
  └─ OpenAI API (external)
  └─ Sarvam TTS API (external)

Coordinator Agent
  └─ Supply Agent (finds listings)
  └─ Firestore (database)
  └─ Notification system

Supply Agent
  └─ Firestore (queries listings)
  └─ Location/distance algorithm

Dispatch Agent
  └─ Volunteer database
  └─ Maps API (routes)
  └─ Notification system

Escalation Agent
  └─ SLA rules engine
  └─ Admin notification
  └─ Retry logic

Food Scan Agent
  └─ OpenAI Vision API
  └─ Firebase Storage (photos)

Quality Check Agent
  └─ Claude Vision API
  └─ Anthropic SDK

Prediction Agent
  └─ ML model (Python microservice)
  └─ Historical data (Firestore)
```

## Next Steps

1. **Verify Sarvam API Key** - Is it valid?
2. **Test API Directly** - Can you call it from curl?
3. **Check Logs** - Run `npm run dev` and check output
4. **Test Each Agent** - Go through testing checklist
5. **Fix Issues** - Address specific agent problems

## Status Dashboard Command

```bash
# To check all agents are working:
npm run dev &
# Then visit each dashboard and test features
# Donor: /donor (Food Scan ✅)
# NGO: /ngo (Coordinator?)
# Restaurant: /restaurant (Supply?)
# Volunteer: /volunteer (Dispatch?)
# Admin: /admin (Escalation?)
```

