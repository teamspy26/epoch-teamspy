# Prasadam - Real-Time Food Redistribution Platform

Prasadam is a modern, real-time platform designed to combat food waste and hunger by connecting restaurants with surplus food to NGOs and beneficiaries in need. It leverages a sophisticated multi-agent system to automate and optimize the process of donation, matching, and delivery.

## Key Features

- **Real-Time Matching:** An intelligent coordinator agent instantly matches new food listings from donors with pending requests from NGOs.
- **Role-Based Dashboards:** Tailored user interfaces for Restaurants, NGOs, Volunteers, and Administrators to manage their specific tasks.
- **Automated Dispatch:** A dispatch agent assigns deliveries to available volunteers and tracks their progress.
- **AI-Powered Food Scanning:** Donors can use their phone's camera to scan food items. An AI agent analyzes the image to identify the food, estimate its quantity, and assess its quality.
- **IVR & Voice Control:** A multilingual IVR system allows users to interact with the platform via phone calls. Voice commands are supported across the dashboards for hands-free operation.
- **WhatsApp Notifications:** NGOs are instantly notified via WhatsApp when a new donation that matches their needs becomes available.
- **Live Maps & Route Tracking:** Volunteers can see the exact delivery route from the pickup location to the drop-off point on an integrated map.

## Architecture Overview

The platform is built on a modern, serverless architecture using Next.js and Firebase. The core logic is orchestrated by a system of autonomous agents that handle different aspects of the redistribution process.

```
Frontend (Next.js App Router)
       │
       ├─► Firebase (Authentication, Firestore DB, Storage)
       │
       └─► API Routes (/api/agents/*)
           ├─► Coordinator Agent (Orchestration)
           ├─► Supply Agent (Listing/Matching Logic)
           ├─► Dispatch Agent (Volunteer Assignment & Tracking)
           ├─► Quality Check Agent (AI Food Analysis)
           └─► Escalation Agent (Handles failures and alerts)
```

## Technology Stack

- **Framework:** Next.js 15 (with App Router)
- **Backend & Database:** Firebase (Firestore, Firebase Auth, Cloud Storage)
- **Deployment:** Vercel
- **AI & Machine Learning:**
  - OpenAI (GPT-4o-mini) for natural language understanding.
  - Sarvam AI for Speech-to-Text and Text-to-Speech.
- **Telephony:** Exotel for the IVR system.
- **Messaging:** Meta's WhatsApp Cloud API for notifications.
- **Mapping:** Google Maps Platform (Directions API).
- **Styling:** Tailwind CSS with shadcn/ui components.
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A Firebase project
- A Meta Developer account for WhatsApp API access
- An Exotel account for IVR

### 1. Clone the Repository

```bash
git clone https://github.com/teamspy26/epoch-teamspy.git
cd epoch-teamspy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.local.example` file to a new file named `.env.local` and fill in the required API keys and credentials for Firebase, Google Maps, WhatsApp, Exotel, and OpenAI.

```dotenv
# Firebase Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... and so on

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# WhatsApp Credentials
WHATSAPP_API_KEY=...
WHATSAPP_PHONE_NUMBER_ID=...

# ... etc.
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## User Roles & Dashboards

- **/restaurant**: Restaurants can post surplus food, view their donation history, and approve matches with NGOs.
- **/ngo**: NGOs can submit requests for food, track the status of their requests, and see incoming deliveries.
- **/volunteer**: Volunteers can see and accept open delivery tasks, view the delivery route on a map, and mark deliveries as complete.
- **/admin**: Administrators can monitor the overall system health, view agent activity logs, and manage escalations.

---

_This project was developed with the assistance of GitHub Copilot._
