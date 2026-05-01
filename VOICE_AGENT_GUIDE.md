/**
 * Voice Agent Implementation Guide
 * 
 * This document explains the voice agent features added to Prasadam using Sarvam AI
 */

# Voice Agent Implementation - Prasadam

## Overview
Voice agents have been integrated into all four dashboards (NGO, Restaurant, Volunteer, Admin) using Sarvam AI for speech-to-text conversion and intent detection. This enables users to perform actions hands-free by simply speaking commands.

## Features by Role

### 🍽️ NGO Dashboard
- **"Need 50 meals"** → Creates food request with quantity
- **"Show food near me"** → Displays available food listings
- **"Check status"** → Shows active requests count

### 🏪 Restaurant Dashboard
- **"Approve"** / **"Accept"** → Approves pending food matches
- **"Decline"** / **"Reject"** → Declines matches
- **"Auto approve on"** → Enables auto-approval mode
- **"Check status"** → Shows pending matches and listings

### 🚚 Volunteer Dashboard
- **"Accept delivery"** → Accepts available pickup
- **"Picked up"** → Marks delivery as picked up
- **"In transit"** → Marks delivery in transit
- **"Delivered"** → Marks delivery completed
- **"Start pickups"** → Initiates delivery route
- **"Check status"** → Shows active/completed deliveries

### 👨‍💼 Admin Dashboard
- **"Show stats"** / **"Today's stats"** → Displays system statistics
- **"Escalations"** → Lists pending escalations
- **"Resolve"** → Resolves top escalation
- **"Check status"** → Shows system health

## Setup

### 1. Get Sarvam AI API Key
1. Visit [sarvam.ai](https://sarvam.ai)
2. Sign up and create a project
3. Generate an API key from the dashboard

### 2. Update Environment Variables
Copy the API key to `.env.local`:
```
NEXT_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key_here
```

Note: The key is `NEXT_PUBLIC_` because it's used in the browser for audio processing.

### 3. Install Dependencies
All required dependencies are already in `package.json`. No additional packages needed.

### 4. Test Voice Input
1. Run the dev server: `npm run dev`
2. Log in to any dashboard
3. Click the microphone button (🎤) in the top-right corner
4. Speak a command (e.g., "Check status")
5. Wait for transcription and intent detection

## Technical Architecture

### Files Created

```
src/
├── lib/
│   └── services/
│       ├── sarvam-ai.ts              # Speech-to-text + intent detection
│       └── voice-intent-handlers.ts  # Role-based action handlers
├── hooks/
│   └── use-voice-input.ts            # React hook for recording & processing
├── components/
│   └── voice-button.tsx              # Voice UI component
└── app/(dashboard)/
    ├── ngo/page.tsx                  # Updated with voice
    ├── restaurant/page.tsx           # Updated with voice
    ├── volunteer/page.tsx            # Updated with voice
    └── admin/page.tsx                # Updated with voice
```

### Flow Diagram
```
User speaks
    ↓
useVoiceInput hook captures audio
    ↓
Audio blob → Sarvam AI API (speech-to-text)
    ↓
Transcript received
    ↓
detectIntent() analyzes transcript
    ↓
Intent + Parameters extracted
    ↓
handleXxxVoiceIntent() executes action
    ↓
UI updated / Navigation / Toast notification
```

## Voice Intent System

### Intent Types

Each role has specific intents mapped to voice commands:

**NGO Intents:**
- `create_request` - Create food request
- `find_food` - Find available food
- `check_status` - Check request status

**Restaurant Intents:**
- `approve_match` - Approve food match
- `decline_match` - Decline food match
- `toggle_auto_approve` - Toggle auto-approval
- `check_status` - Check status

**Volunteer Intents:**
- `accept_delivery` - Accept delivery
- `mark_picked_up` - Mark picked up
- `mark_in_transit` - Mark in transit
- `mark_delivered` - Mark delivered
- `start_pickups` - Start route
- `check_status` - Check status

**Admin Intents:**
- `show_stats` - Show statistics
- `list_escalations` - List escalations
- `resolve_escalation` - Resolve escalation
- `check_status` - Check status

### Confidence Scoring
Each detected intent has a confidence score (0-1):
- **> 0.8**: High confidence, action executed
- **0.5-0.8**: Medium confidence, user can verify
- **< 0.5**: Low confidence, command rejected

## Language Support
Currently supports:
- English (en-IN) - default
- Hindi, Tamil, Telugu support ready (coming soon)

The language selector in the voice panel allows switching between languages.

## Security Considerations

1. **API Key Protection**: `NEXT_PUBLIC_SARVAM_API_KEY` is browser-accessible but rate-limited by Sarvam
2. **Audio Privacy**: Audio is sent directly to Sarvam's servers, not stored on your backend
3. **Intent Validation**: All intents are validated against user's role and permissions
4. **CORS**: Sarvam API handles CORS headers for browser requests

## Troubleshooting

### "Microphone access denied"
- Check browser permissions for microphone
- Grant permission when prompted
- Try in a different browser

### "Transcription failed"
- Check internet connection
- Verify Sarvam API key is valid
- Check if API quota is exceeded

### "Intent not recognized"
- Speak more clearly
- Use keywords from the command list above
- Try again with different wording

### Voice button not appearing
- Ensure `voiceEnabled` state is true
- Check browser console for errors
- Verify Sarvam API key is set in `.env.local`

## Future Enhancements

1. **Multi-language Support** - Complete Hindi, Tamil, Telugu support
2. **Custom Intents** - Admin can define custom voice commands
3. **Voice Feedback** - Text-to-speech responses
4. **Command History** - Track voice commands used
5. **Voice Analytics** - Analyze most common commands per role
6. **Offline Support** - Local speech recognition fallback

## Performance Notes

- First transcription takes ~2-3 seconds (API overhead)
- Subsequent requests are faster with connection pooling
- Audio quality affects transcription accuracy
- Longer audio files take proportionally longer

## Testing Commands

### NGO Testing
- "I need 50 meals urgently"
- "Find food nearby"
- "What's my status"

### Restaurant Testing
- "Approve this request"
- "Turn on auto approve"
- "How many requests pending"

### Volunteer Testing
- "Accept delivery"
- "Mark as picked up"
- "Start deliveries"

### Admin Testing
- "Show me today's statistics"
- "List escalations"
- "What's the system status"

## Support
For issues with Sarvam AI integration:
1. Check [Sarvam Documentation](https://sarvam.ai/docs)
2. Review browser console for errors
3. Check network tab in DevTools for API requests
4. Contact Sarvam support if API is unresponsive
