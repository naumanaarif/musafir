<p align="center">
  <img src="C:\Users\Saif Ali Khan\.gemini\antigravity\brain\21fac335-c1f7-40fd-a1b5-da61cfc8ac83\musafir_minimal_banner_1778759861814.png" alt="Musafir AI Banner" width="100%">
</p>

# Musafir AI 🚌 — Karachi Transit Planner

Musafir is an AI-powered transit planning application designed specifically for Karachi's unique public transport ecosystem. It combines real-world local data with the power of **Google Gemini 1.5 Flash** and **Supabase pgvector** to provide accurate, context-aware bus routes and transit advice.

## 🚀 The Problem
Karachi's public transport (Minibuses, Coaches, and BRTs) is vast but undocumented. For many commuters, finding the right bus number or stop is a matter of "asking around." Google Maps often lacks this local transit data, defaulting to driving directions.

**Musafir solves this by:**
- Digitizing 140+ local bus routes.
- Using **RAG (Retrieval-Augmented Generation)** to match natural language queries (Semantic Search) to local bus data.
- Providing an **AI Transit Guide** that gives specific, "real talk" advice about fares, landmarks, and peak hours.

## 🛠️ Tech Stack & Dependencies

### Frontend
- **React + Vite**: For a lightning-fast, modern UI.
- **Google Maps JS API**: For interactive map visualization and routing.
- **Material Symbols**: For a clean, modern design language.
- **Context API**: For seamless journey state management.

### Backend
- **FastAPI (Python)**: High-performance API handling.
- **Supabase (PostgreSQL + pgvector)**: Vector database for semantic search of transit routes.
- **Google Gen AI SDK**: Powering the Gemini 1.5 Flash (and Flash-lite) transit expert.

## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
```
Run the server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```
Run the app:
```bash
npm run dev
```

## 🎯 How to Use
1. Enter your **Origin** (e.g., "Saddar") and **Destination** (e.g., "Clifton").
2. The app will search our local database for the best bus match.
3. Use the **AI Guide** in the results sidebar for specific local tips and approximate fares.
4. Follow the step-by-step navigation for your journey!

---
Built for the Google Gemini Hackathon.
