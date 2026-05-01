# Food Scan Failure Troubleshooting

## Problem
User uploads an image to the Donor dashboard but gets "Scan failed. Please try again." error.

## Root Cause
The food scan feature uses **OpenAI Vision API** to analyze food photos. The scan fails when:

1. **Missing OpenAI API Key** (most common)
2. OpenAI API key is invalid or expired
3. API rate limit exceeded
4. Image format/size issues
5. Network timeout

## Solutions

### Step 1: Check API Key Configuration

#### Option A: Quick Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response if everything is configured:
```json
{
  "status": "✅ All configured",
  "checks": {
    "openaiApiKey": true,
    "sarvamApiKey": true,
    "firebaseProjectId": true,
    "whatsappApiKey": false
  },
  "missingKeys": []
}
```

If `openaiApiKey` is `false`, you need to add it.

#### Option B: Check `.env.local`
1. Open `.env.local` in the project root
2. Verify this line exists and has a valid key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxx...
   ```

### Step 2: Get or Verify OpenAI API Key

#### Create a New Key:
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Log in or create an account
3. Go to **API Keys** → **Create new secret key**
4. Copy the key (you won't see it again!)
5. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

#### If you have an existing key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Check **API Keys** section
3. Verify the key is not revoked
4. Check your account has available credits/quota
5. Ensure billing is set up

### Step 3: Restart Dev Server
After updating `.env.local`:
```bash
npm run dev
```

### Step 4: Test Again
1. Go to Donor dashboard
2. Upload a food image
3. Click "Scan with AI"

## Error Messages & Meanings

| Message | Cause | Solution |
|---------|-------|----------|
| "Scan failed. Please try again." | Generic error | Check console logs, verify API key |
| "API not configured..." | OPENAI_API_KEY not set | Add to `.env.local` and restart |
| "API authentication failed..." | Invalid/expired key | Get new key from OpenAI |
| "API rate limit exceeded..." | Too many requests | Wait a moment and retry |
| "Analysis took too long..." | Network/API timeout | Try with a clearer photo or try again |

## Check Server Logs

In your dev server terminal, look for lines like:
```
[Food Scan] Starting analysis for user: user123
[Food Scan] Raw response: {"safe":true,...
[Food Scan] Analysis complete: { safe: true, foodName: '...' }
```

If you see error logs instead:
```
[Food Scan Agent] Full error: { message: '401 Unauthorized', ... }
```

This tells you exactly what went wrong.

## Image Requirements

The scan works best with:
- **Format**: JPG, PNG (most common)
- **Size**: Under 20MB
- **Aspect ratio**: Any
- **Quality**: Clear, well-lit photos
- **Content**: Actual food (not packaging)

## Still Having Issues?

### Check the Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Upload image and click "Scan with AI"
4. Look for the `/api/agents/food-scan` request
5. Check the **Response** tab to see exact error

### Common Network Issues
- **CORS errors**: Check browser console
- **404 Not Found**: Route might be wrong (should be `/api/agents/food-scan`)
- **500 Server Error**: Check server console for detailed error

### Test with cURL (Advanced)

If you want to test the API directly:
```bash
# Prepare a base64-encoded image
base64 -w 0 food.jpg > food.b64

# Test the endpoint
curl -X POST http://localhost:3000/api/agents/food-scan \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,YOUR_BASE64_HERE",
    "userId": "test-user"
  }'
```

## Performance Notes

- First analysis: 2-5 seconds (API overhead)
- Subsequent requests: 1-3 seconds
- If slower, check network connectivity
- If timeout (>60s), image might be too large

## Cost Implications

Each food scan costs ~$0.01 USD (using gpt-4o-vision). Budget accordingly:
- 100 scans/day = ~$1/day
- 3,000 scans/month = ~$30/month

## Production Checklist

Before going live:
- [ ] OPENAI_API_KEY is added to production environment
- [ ] API key has sufficient quota/credits
- [ ] Billing is enabled on OpenAI account
- [ ] Key is rotated every 90 days
- [ ] Error logging is monitored
- [ ] Rate limiting is in place (optional)
