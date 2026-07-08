# 🌍 CivicPulse AI

> **AI-Powered Constituency Intelligence Platform**
>
> 🏆 Built for **Build with AI: Code for Communities**

CivicPulse AI is an AI-powered web platform that helps Members of Parliament (MPs) transform unstructured citizen grievances into actionable constituency intelligence. By combining Google's Gemini API, Firebase, and Google Maps, the platform automatically classifies complaints, prioritizes them based on urgency and recurrence, and visualizes them geographically to support evidence-based decision-making.

---

# 📖 Problem Statement

Members of Parliament receive grievances and development requests from multiple disconnected channels such as public meetings, letters, social media, and grievance portals.

These complaints are often:

- Fragmented across different platforms
- Difficult to prioritize
- Repetitive
- Lacking geographic context
- Time-consuming to process manually

Without intelligent analysis, recurring issues often remain hidden, making constituency planning inefficient.

---

# 💡 Our Solution

CivicPulse AI centralizes citizen grievances into a single AI-powered platform.

Citizens submit complaints through a responsive web portal. Google Gemini automatically analyzes every complaint to:

- Categorize the issue
- Determine urgency
- Extract the landmark/location
- Generate a concise action summary

The processed complaint is stored in Firebase Firestore and immediately becomes available in the MP Dashboard, where representatives can prioritize, visualize, and resolve issues efficiently.

---

# 🚀 Core Features

## 👤 Citizen Portal

- Submit grievances through a responsive web interface
- AI-powered complaint analysis using Google Gemini
- Automatic issue categorization
- Urgency prediction (Low / Medium / High)
- Landmark extraction
- AI-generated action summary

---

## 🏛 MP Dashboard

- Secure Google Sign-In using Firebase Authentication
- Live Priority Backlog
- AI-generated complaint summaries
- Google Maps hotspot visualization
- Priority-based complaint sorting
- Mark complaints as resolved
- Real-time Firestore synchronization

---

## 🤖 AI Capabilities

Google Gemini automatically performs:

- Complaint classification
- Urgency estimation
- Landmark extraction
- One-line action summary generation

This converts unstructured citizen feedback into structured constituency intelligence.

---

# 📊 Smart Prioritization

Each complaint is assigned a **Priority Score** based on:

```
Priority Score =
Urgency Weight × Number of Repeat Complaints
```

Urgency Weights:

- 🔴 High = 3
- 🟠 Medium = 2
- 🟢 Low = 1

This ensures frequently reported, high-impact issues receive immediate attention.

---

# 🗺 Geographic Intelligence

Extracted landmarks are visualized using **Google Maps Platform**, enabling MPs to:

- Detect complaint hotspots
- Identify recurring infrastructure issues
- Allocate resources efficiently
- Understand constituency-wide issue distribution

---

# 🏗 System Architecture

```text
Citizen
    │
    ▼
React Web Portal
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

# 🛠 Tech Stack

| Category | Technology |
|----------|------------|
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

# 📱 Application Workflow

1. Citizen submits a grievance.
2. Google Gemini analyzes the complaint.
3. AI generates:
   - Category
   - Urgency
   - Landmark
   - Action Summary
4. Complaint is stored in Firestore.
5. MP Dashboard updates in real time.
6. Priority score is calculated.
7. Complaint appears on Google Maps.
8. MP marks issue as resolved.

---

# 🎯 Alignment with the Challenge

CivicPulse AI addresses the **Build with AI: Code for Communities** challenge by:

- ✅ Collecting citizen feedback
- ✅ Using Generative AI for automated analysis
- ✅ Identifying recurring community issues
- ✅ Prioritizing constituency needs
- ✅ Visualizing geographic demand hotspots
- ✅ Supporting evidence-based decision making

---

# 🚀 Future Scope

The current architecture has been designed to support future integrations including:

- WhatsApp Business API
- Voice-based complaint submission
- Multilingual support
- Public datasets (Census, data.gov.in)
- Predictive constituency analytics
- AI-assisted development planning

---

# 📸 Screenshots

## Citizen Portal

> *(Add screenshot here)*

## MP Dashboard

> *(Add screenshot here)*

## Google Maps Hotspot View

> *(Add screenshot here)*

---

# ⚙ Installation

Clone the repository:

```bash
git clone https://github.com/iamaadityam/Grievance-Registration.git
```

Navigate into the project:

```bash
cd Grievance-Registration
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# 👥 Team

**Project:** CivicPulse AI

**Hackathon:** Build with AI: Code for Communities

**Team Members**

- Aaditya Malhotra
- <Member 2>
- <Member 3>
- <Member 4>

---

# 🙏 Acknowledgements

Built using Google's AI ecosystem, including:

- Google Gemini API
- Firebase Authentication
- Firebase Firestore
- Google Maps Platform
- Google Cloud Run

Special thanks to the **Build with AI: Code for Communities** organizers for providing the opportunity to build AI-powered civic solutions.

---

# 📜 License

This project was developed for the **Build with AI: Code for Communities** hackathon and is intended for educational and demonstration purposes.
