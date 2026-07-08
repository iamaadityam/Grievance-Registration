<div align="center">

# <img src="./assets/logo.png" alt="CivicPulse AI Logo" width="140"/>

# 🌍 CivicPulse AI

### Bridging the Gap of Urban and Rural Areas Between People's Street Problems and Governance Strategy

### 🏆 Build with AI: Code for Communities

</div>

---

# 👥 Team Name

## NagarLink

---

# 💡 Team Description

We are a multidisciplinary team of engineers and civic-tech innovators focused on creating frictionless, inclusive channels for public administration.

By deploying a modern, 100% Google-native ecosystem, we specialize in building intelligent, conversational intake models that eliminate literacy barriers for everyday citizens. Simultaneously, we translate unstructured community feedback into structured, spatial analytics that empower public representatives to execute data-driven, objective infrastructure planning across local constituencies.

---

# 📖 Problem Statement

Members of Parliament receive development requests and civic grievances through multiple disconnected channels such as public meetings, letters, grievance portals, and social media.

These complaints are:

- Fragmented across different sources
- Difficult to prioritize
- Repetitive
- Time-consuming to analyze manually
- Lacking geographic intelligence

As a result, representatives often struggle to objectively identify recurring community needs and prioritize infrastructure projects based on real citizen demand.

---

# ✅ Our Solution

CivicPulse AI is an AI-powered constituency intelligence platform that transforms unstructured citizen grievances into actionable governance insights.

Using Google's Gemini AI, every complaint is automatically analyzed to:

- Categorize the issue
- Determine urgency
- Extract landmark/location
- Generate a concise action summary

The processed complaint is securely stored in Firebase Firestore and immediately becomes available in the MP Dashboard, where representatives can visualize hotspots, prioritize recurring issues, and efficiently resolve grievances.

Rather than simply collecting complaints, CivicPulse AI converts citizen voices into structured constituency intelligence.

---

# 🚀 Core Features

## 👤 Citizen Portal

- Responsive web-based grievance submission
- Natural language complaint input
- AI-powered complaint classification
- Automatic urgency detection
- Landmark extraction
- AI-generated action summary

---

## 🏛 MP Dashboard

- Secure Google Sign-In
- Live grievance backlog
- AI-generated summaries
- Priority-based complaint ranking
- Google Maps hotspot visualization
- Mark grievances as resolved
- Real-time Firestore synchronization

---

# 🤖 AI Capabilities

Google Gemini automatically performs:

- Complaint categorization
- Urgency prediction
- Landmark extraction
- Action summary generation

This converts free-form citizen complaints into structured administrative data.

---

# 📊 Smart Prioritization

Every complaint receives a **Priority Score**.

```
Priority Score =
Urgency Weight × Number of Repeat Complaints
```

Urgency Weights

- 🔴 High = 3
- 🟠 Medium = 2
- 🟢 Low = 1

This ensures recurring and high-impact issues automatically receive higher priority.

---

# 🗺 Geographic Intelligence

Using Google Maps Platform, CivicPulse AI visualizes complaint hotspots across constituencies.

This enables representatives to:

- Detect recurring civic issues
- Identify infrastructure gaps
- Allocate resources efficiently
- Make evidence-based planning decisions

---

# 🏗 System Architecture

```
Citizen
     │
     ▼
React + Vite Web Portal
     │
     ▼
Express + Node.js Backend
     │
     ▼
Google Gemini API
     │
     ▼
Firebase Firestore
     │
     ▼
MP Dashboard
```

---

# ⚙ Tech Stack

| Category | Technology |
|-----------|------------|
| Frontend | React 19 + Vite 6 |
| Styling | Tailwind CSS 4 |
| Animations | Motion |
| Backend | Node.js + Express |
| AI | Google Gemini API |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| Maps | Google Maps Platform |
| Deployment | Google Cloud Run |
| Build Tool | esbuild |

---

# 🔄 How Our Website Works

1. Citizen submits a grievance.
2. Gemini AI analyzes the complaint.
3. AI generates:
   - Category
   - Urgency
   - Landmark
   - Action Summary
4. Complaint is stored in Firebase Firestore.
5. MP Dashboard updates instantly.
6. Priority Score is calculated.
7. Complaint appears on Google Maps.
8. MP resolves the issue.

---

# 🌐 Working URL

Please click the link below to access the live deployment of CivicPulse AI.

https://civicpulse-ai-spot-snap-solve-696821570384.asia-east1.run.app

---

# 🎯 Alignment with Build with AI

CivicPulse AI directly addresses the Build with AI: Code for Communities challenge by:

- ✅ Collecting citizen feedback
- ✅ AI-powered complaint understanding
- ✅ Intelligent prioritization
- ✅ Geographic hotspot detection
- ✅ Evidence-based constituency planning
- ✅ Real-time grievance management

---

# 🚀 Future Scope

- WhatsApp Business Integration
- Voice-based complaint submission
- Multilingual support
- Public datasets (Census, data.gov.in)
- Satellite imagery
- Predictive infrastructure planning

---

# 📸 Screenshots

## Citizen Portal

*(Insert Screenshot)*

---

## MP Dashboard

*(Insert Screenshot)*

---

## Google Maps Hotspot View

*(Insert Screenshot)*

---

# 🛠 Installation

Clone the repository

```bash
git clone https://github.com/iamaadityam/Grievance-Registration.git
```

Install dependencies

```bash
npm install
```

Run locally

```bash
npm run dev
```

---

# 👥 Authors

### Aaditya Malhotra

LinkedIn:
https://linkedin.com/in/malhotra-aaditya

GitHub:
https://github.com/iamaadityam

---

### Vanshika Tanwar

LinkedIn:
https://www.linkedin.com/in/vanshika-tanwar-3319171b7/
---

### Shibam

---

# 🙏 Acknowledgements

Built using the Google AI ecosystem:

- Google Gemini API
- Firebase Authentication
- Firebase Firestore
- Google Maps Platform
- Google Cloud Run

Special thanks to the **Build with AI: Code for Communities** organizers for promoting AI-powered civic innovation.

---

<div align="center">

### 🌍 CivicPulse AI

**Turning Citizen Voices into Smarter Governance**

</div>
