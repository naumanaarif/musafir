# Musafir AI — Product Spec Kit

**Version:** 1.1  
**Date:** May 2026  
**Prepared for:** Antigravity (UX/UI via Google Stitch → Frontend)  
**Product:** Musafir AI — Karachi Public Transport Journey Planner

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Core Features](#5-core-features)
6. [User Flow](#6-user-flow)
7. [Technical Architecture](#7-technical-architecture)
8. [Google Tools Stack](#8-google-tools-stack)
9. [RAG-Based Agentic System](#9-rag-based-agentic-system)
10. [UI/UX Design System (Google Stitch)](#10-uiux-design-system-google-stitch)
11. [Responsive Design Specifications](#11-responsive-design-specifications)
12. [Screen Inventory](#12-screen-inventory)
13. [API Contracts](#13-api-contracts)
14. [Data Models](#14-data-models)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Milestones & Phasing](#16-milestones--phasing)
17. [Open Questions](#17-open-questions)

---

## 1. Product Overview

**Musafir AI** (مسافر — Urdu for "Traveler") is an AI-powered public transport journey planner for Karachi, Pakistan. It helps residents navigate Karachi's fragmented public transport network — including city buses, Chinchi rickshaws, and the BRT (Bus Rapid Transit) Green Line — using natural language input in English, Urdu, or Roman Urdu, real-time routing via Google Maps, and a RAG-based AI agent that understands local transit knowledge.

**Tagline:** *"Karachi ka safar, aasaan karo."* (Make your Karachi journey easy.)

---

## 2. Problem Statement

Karachi's public transport is one of the most complex and undocumented transit ecosystems in South Asia:

- **No single source of truth** for routes, stops, or schedules.
- **No real-time data** about bus locations or delays.
- **Language barrier** — most apps are English-only; the majority of commuters speak Urdu or Roman Urdu.
- **Multi-modal gaps** — a journey often requires combining BRT + bus + Chinchi, with no planner bridging them.
- **Digital exclusion** — existing tools (Mnzl) are stop-centric, not journey-centric; none are AI-driven.

Musafir AI solves this by combining Google's routing infrastructure with a locally-trained AI knowledge base and natural language understanding.

---

## 3. Target Users

| Persona | Description | Key Need |
|---|---|---|
| **Daily Commuter** | Office-goer, 20–45, uses buses/BRT daily | Fast route lookup, Urdu support |
| **First-Time Rider** | Student, new to public transport | Step-by-step guidance, no jargon |
| **Low-Data User** | Feature phone upgrade user, limited data | Lightweight UI, minimal bandwidth |
| **Accessibility User** | Elderly or mobility-limited | Large tap targets, voice input |

**Primary language mix:** 60% Roman Urdu, 25% Urdu script, 15% English.

---

## 4. Competitive Landscape

| App | Strengths | Weaknesses |
|---|---|---|
| **Makkah Bus** | Live bus tracking, complete journey routing for Makkah | Not relevant to Karachi; no AI |
| **Mnzl** | Comprehensive Karachi stop/route database | Stop-centric only; no AI; no voice; English only. **Data scraped as primary RAG corpus source.** |
| **Google Maps** | Routing infrastructure, live traffic | Poor Karachi transit data; no Chinchi; no Urdu |
| **Musafir AI** | AI + voice + multilingual + RAG local knowledge + Google Maps routing | To be built |

**Key differentiator:** Musafir AI is the only Karachi transit app combining AI natural language understanding with Google Maps routing and a locally curated RAG knowledge base.

---

## 5. Core Features

### 5.1 Input Methods (Priority: P0)

- **Text box input** — From / To fields with Google Places Autocomplete biased to Karachi
- **Voice input** — Speech-to-text via Google Cloud Speech-to-Text API; supports English, Urdu, Roman Urdu
- **Prompt/Chat input** — Free-text prompt e.g. "mujhe Saddar se Gulshan jana hai" routed through AI agent

### 5.2 Journey Planning (Priority: P0)

- Fetches multi-modal routes combining BRT, city buses, Chinchi via Google Maps Directions API (Transit mode) + RAG agent for local gap-filling
- Displays 2–3 journey options ranked by time, transfers, and walk distance
- Shows fare estimate per leg

### 5.3 Live Journey Tracking (Priority: P0)

- Real-time user location via Google Maps JavaScript API (Geolocation)
- Step-by-step navigation with "next stop" notifications
- Progress indicator on route map

### 5.4 Multilingual AI Agent (Priority: P0)

- Accepts prompts in English, Urdu (Nastaliq script), Roman Urdu
- Powered by Gemini API (Google AI Studio) + RAG corpus
- Responds in the same language/script as input

### 5.5 RAG Knowledge Base (Priority: P1)

- Curated dataset of Karachi bus routes, stops, BRT stops, Chinchi zones
- Augments Google Maps data where transit data is missing or incorrect
- Updated manually/semi-automatically from community and operator sources

### 5.6 Saved Journeys (Priority: P1)

- Save frequent journeys (Home → Office)
- Accessible from home screen as one-tap shortcuts

### 5.7 Journey Alerts (Priority: P2)

- Notify user when to get off (geofence-based)
- Notify of estimated delays based on traffic

---

## 6. User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        LAUNCH                               │
│   User opens Musafir AI (PWA or web browser)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     HOME SCREEN                             │
│  • Search bar (From / To) with mic icon                     │
│  • "Use my location" toggle                                 │
│  • Quick-access saved journeys                              │
│  • Language toggle (EN / اردو / Roman)                      │
└─────────┬─────────────────────────┬───────────────────────┘
          │                         │
   Text/Voice Input           Prompt Input (Chat)
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────────────┐
│  LOCATION PICKER │     │       AI AGENT PARSER            │
│  Google Places   │     │  Gemini API + RAG                │
│  Autocomplete    │     │  Extracts origin, destination,   │
│  (Karachi-biased)│     │  preferences from natural lang   │
└────────┬─────────┘     └─────────────┬────────────────────┘
         │                             │
         └──────────┬──────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   JOURNEY SEARCH ENGINE                     │
│  1. Google Maps Directions API (Transit)                    │
│  2. RAG agent fills gaps (missing routes/stops)             │
│  3. Fare + transfer + walk distance scoring                 │
│  4. Returns 2–3 ranked journey options                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESULTS SCREEN                             │
│  • Journey cards (time, transfers, walk, fare)              │
│  • Map preview with route drawn                             │
│  • "Start Journey" CTA on preferred option                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                    User taps "Start"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ACTIVE JOURNEY SCREEN                      │
│  • Full-screen Google Map                                   │
│  • Live location dot (blue)                                 │
│  • Step card at bottom: "Board Bus 4K at Nursery Stop"      │
│  • Progress bar: stops remaining                            │
│  • "Get off here" alert (geofence trigger)                  │
│  • Voice readout of instructions                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (PWA)                            │
│   React + Tailwind CSS  |  Google Maps JS API  |  Responsive       │
│   Designed in Google Stitch → exported to code                     │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTPS / REST / WebSocket
┌──────────────────────────────▼─────────────────────────────────────┐
│                        BACKEND (Node.js / Python FastAPI)          │
│                                                                    │
│  ┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  Route Planner  │   │   AI Agent       │   │  Auth Service  │  │
│  │  (Orchestrator) │   │ (Gemini + RAG)   │   │  (Firebase)    │  │
│  └────────┬────────┘   └────────┬─────────┘   └────────────────┘  │
│           │                     │                                  │
└───────────┼─────────────────────┼──────────────────────────────────┘
            │                     │
    ┌───────▼──────┐    ┌─────────▼────────────────────────┐
    │ Google APIs  │    │         RAG Pipeline              │
    │              │    │                                   │
    │ • Directions │    │  ┌──────────────┐  ┌──────────┐  │
    │   API        │    │  │ Vector Store │  │ Corpus   │  │
    │ • Maps JS    │    │  │ (Vertex AI   │  │ Karachi  │  │
    │ • Places API │    │  │  Matching    │  │ Transit  │  │
    │ • Geocoding  │    │  │  Engine)     │  │ Dataset  │  │
    │ • Speech-to- │    │  └──────────────┘  └──────────┘  │
    │   Text       │    │                                   │
    │ • Gemini API │    └───────────────────────────────────┘
    └──────────────┘
```

### Key Backend Services

| Service | Technology | Purpose |
|---|---|---|
| Route Orchestrator | Python FastAPI | Combines Maps API + RAG results |
| AI Agent | Gemini 1.5 Flash | NLU, intent extraction, response |
| RAG Pipeline | Vertex AI + LangChain | Local transit knowledge retrieval |
| Vector Store | Vertex AI Matching Engine | Semantic search over route corpus |
| Auth | Firebase Auth | Anonymous + Google Sign-In |
| Real-time | Firebase Realtime DB | Live location sharing (future) |
| Hosting | Firebase Hosting | PWA delivery + CDN |

---

## 8. Google Tools Stack

| Layer | Tool | Usage |
|---|---|---|
| **Routing** | Google Maps Directions API (Transit) | Core journey computation |
| **Map Display** | Google Maps JavaScript API | Interactive map, route overlays |
| **Location** | Google Maps Geolocation API | User's current position |
| **Place Search** | Google Places API (Autocomplete) | From/To input with Karachi bias |
| **Geocoding** | Google Geocoding API | Convert addresses ↔ coordinates |
| **Voice Input** | Google Cloud Speech-to-Text | Urdu + English + Roman Urdu voice input |
| **AI / NLU** | Gemini API (Google AI Studio) | Natural language journey requests |
| **RAG / Embeddings** | Vertex AI Embeddings + Matching Engine | RAG over local transit corpus |
| **Auth** | Firebase Authentication | User accounts, saved journeys |
| **Database** | Firebase Firestore | User preferences, saved routes |
| **Hosting** | Firebase Hosting | PWA deployment |
| **Analytics** | Google Analytics 4 | Usage tracking, funnel analysis |
| **Design** | Google Stitch | UX/UI design → production-ready components |

> **Design Note for Google Stitch:** All screens will be designed in Google Stitch using Material Design 3 tokens. Component exports from Stitch will be used directly in the React frontend to maintain design-code consistency.

---

## 9. RAG-Based Agentic System

### 9.1 Overview

The AI agent augments Google Maps' sometimes-sparse Karachi transit data with a retrieval-augmented knowledge base built from scraped Mnzl app data. Mnzl is the most comprehensive existing source of Karachi transit stops and routes, making it the ideal foundation for the RAG corpus. The scraper runs once to seed the corpus, with incremental re-scrapes to catch updates.

### 9.2 Knowledge Corpus

**Primary source: Mnzl app (scraped)**

Mnzl's dataset is scraped, cleaned, and transformed into structured RAG documents. The scrape targets:

- **Bus routes:** Route number, operator, origin terminal, destination terminal, major stops in order, frequency, operating hours
- **BRT Green Line:** All 24 stations, feeder routes, interchange points
- **Chinchi zones:** Approximate coverage areas, fare bands, peak hours
- **Fare tables:** Per-route, per-mode fare information
- **Local landmarks:** Colloquial stop names (e.g., "Teen Talwar" vs "Clifton Roundabout")
- **Transfer points:** Known interchange stops between routes

**Scrape → Corpus Pipeline:**

```
Mnzl App
   │
   ▼
Scraper (Python + Playwright/Requests)
   │  Extracts: routes, stops, sequences, fares
   ▼
Raw JSON / CSV
   │
   ▼
Cleaning & Enrichment Script
   │  • Deduplicates stops
   │  • Orders stops into sequences per route
   │  • Normalises stop names (Urdu ↔ Roman Urdu ↔ English)
   │  • Flags missing fare/frequency data
   ▼
Structured RouteDocument JSON
   │
   ▼
Vertex AI Embeddings (text-embedding-004)
   │
   ▼
Vertex AI Matching Engine (Vector Store)
```

**Key processing step:** Mnzl is stop-centric; the cleaning script must stitch stops into ordered route sequences so the RAG agent can reason about "board at stop X, ride 6 stops, alight at stop Y." This is the most critical transformation in the pipeline.

### 9.3 Agent Architecture

```
User Prompt (any language)
        │
        ▼
┌───────────────────────────────┐
│     Language Detection        │
│  (Google Translate API)       │
└────────────┬──────────────────┘
             │ Normalized English intent
             ▼
┌───────────────────────────────┐
│     Intent Extraction         │
│  Gemini: extract origin,      │
│  destination, preferences     │
└────────────┬──────────────────┘
             │ Structured query
   ┌─────────┴────────┐
   │                  │
   ▼                  ▼
Google Maps       RAG Retrieval
Directions API    (Vertex AI)
   │                  │
   └─────────┬────────┘
             │ Combined context
             ▼
┌───────────────────────────────┐
│    Gemini Response Generator  │
│  Merges Maps route data +     │
│  RAG local knowledge →        │
│  structured journey plan      │
└────────────┬──────────────────┘
             │
             ▼
   Formatted Journey Cards
   (rendered on frontend)
```

### 9.4 RAG Retrieval Flow

1. User query is embedded via `text-embedding-004` (Vertex AI)
2. Nearest neighbor search against route corpus in Matching Engine
3. Top-K chunks (K=5) returned as context
4. Gemini prompt: `[system: transit expert] + [retrieved chunks] + [user query]`
5. Structured JSON response parsed by backend orchestrator

### 9.5 Corpus Maintenance

| Phase | Source | Method |
|---|---|---|
| **V1** | Mnzl app scrape (full) | Python scraper → clean → embed → deploy |
| **V2** | Mnzl re-scrape (incremental) + in-app user corrections | Diff against V1, re-embed changed routes only |
| **V3** | KTC operator data (if partnership secured) | Automated ingestion pipeline replaces scraped data |

**Re-scrape trigger:** Run Mnzl scrape monthly, or on-demand when route complaints spike in analytics.

---

## 10. UI/UX Design System (Google Stitch)

### 10.1 Design Tool

**Tool:** Google Stitch  
**Output:** Component specs + design tokens → exported to React components  
**Handoff format:** Stitch → Figma-compatible → React code

### 10.2 Design Language

Base: **Material Design 3 (Material You)**  
Customized for Musafir AI with:

- Karachi-local color palette (see below)
- Urdu/Nastaliq typography support
- RTL layout support for Urdu mode
- High-contrast accessible variants

### 10.3 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#1A6B4A` | Karachi green — CTAs, active states |
| `--color-primary-light` | `#E8F5EE` | Backgrounds, chips |
| `--color-secondary` | `#E85D04` | Accents, alerts, highlights |
| `--color-surface` | `#FAFAF8` | Card backgrounds |
| `--color-background` | `#F4F2EE` | Page background (warm white) |
| `--color-on-primary` | `#FFFFFF` | Text on primary |
| `--color-text-primary` | `#1C1C1E` | Body text |
| `--color-text-secondary` | `#6B6B6B` | Captions, secondary labels |
| `--color-BRT` | `#1A6B4A` | BRT route color |
| `--color-bus` | `#2563EB` | City bus route color |
| `--color-chinchi` | `#D97706` | Chinchi route color |
| `--color-walk` | `#6B7280` | Walking leg color |

### 10.4 Typography

| Scale | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Display | Noto Nastaliq Urdu / Inter | 700 | 28px | App name, hero text |
| Title Large | Inter | 600 | 22px | Screen titles |
| Title Medium | Inter | 600 | 16px | Card titles |
| Body | Inter | 400 | 14px | Body text |
| Label | Inter | 500 | 12px | Chips, labels |
| Urdu Body | Noto Nastaliq Urdu | 400 | 16px | Urdu content (larger for readability) |

> **Note:** Load `Noto Nastaliq Urdu` from Google Fonts for all Urdu script rendering.

### 10.5 Component Library (Stitch Components)

The following components should be designed in Google Stitch:

| Component | Variants | Notes |
|---|---|---|
| `SearchBar` | Default, Focused, With-Mic | Dual-row From/To layout |
| `JourneyCard` | BRT, Bus, Mixed, Walking | Color-coded by transport mode |
| `RouteChip` | BRT, Bus, Chinchi, Walk | Small pill with mode icon |
| `StepInstruction` | Board, Walk, Alight | Bottom sheet card for active journey |
| `MapOverlay` | Route drawn, Live dot | Google Maps layer |
| `VoiceButton` | Idle, Listening, Processing | Mic FAB with pulse animation |
| `LanguageSwitcher` | EN / UR / Roman | Toggle in header |
| `SavedJourneyTile` | Default, Empty state | Home screen shortcuts |
| `FareChip` | Estimate, Confirmed | Shows PKR amount |
| `AlertBanner` | Info, Warning, Success | Journey alerts |

---

## 11. Responsive Design Specifications

### 11.1 Breakpoints

| Breakpoint | Width | Target Device |
|---|---|---|
| `xs` | 320px–479px | Small Android phones (very common in Karachi) |
| `sm` | 480px–767px | Standard Android phones |
| `md` | 768px–1023px | Tablets |
| `lg` | 1024px+ | Desktop / laptop |

> **Mobile-first:** All designs start at `xs`. 90%+ of Karachi users are on mobile.

### 11.2 Layout Grid

| Breakpoint | Columns | Gutter | Margin |
|---|---|---|---|
| xs / sm | 4 | 16px | 16px |
| md | 8 | 24px | 32px |
| lg | 12 | 24px | 48px |

### 11.3 Touch Targets

- Minimum tap target: **48×48px** (Material Design standard)
- All interactive elements (bus stops, CTA buttons, mic) must meet this minimum
- Route cards: full-width tappable area on mobile

### 11.4 Map Behavior

| Screen Size | Map Behavior |
|---|---|
| Mobile | Map takes 40% of screen on results; full-screen on active journey |
| Tablet | Map takes 50% in split view alongside results list |
| Desktop | Persistent side panel (results left, map right) |

### 11.5 RTL Support (Urdu Mode)

When language is set to Urdu (script mode):

- Layout direction flips to RTL (`dir="rtl"`)
- All icons and arrows mirror
- `Noto Nastaliq Urdu` font activates
- Input fields accept right-to-left text

---

## 12. Screen Inventory

| Screen | Route | Description | Priority |
|---|---|---|---|
| **Home** | `/` | Search entry point, saved journeys | P0 |
| **Journey Results** | `/results` | 2–3 route options, map preview | P0 |
| **Active Journey** | `/journey/:id` | Full-screen turn-by-turn with live location | P0 |
| **Journey Detail** | `/journey/:id/detail` | Full step list, fare breakdown | P0 |
| **Chat / Prompt** | `/chat` | AI agent conversation interface | P0 |
| **Saved Journeys** | `/saved` | User's saved routes | P1 |
| **Onboarding** | `/onboarding` | First-time user: language select + permissions | P1 |
| **Settings** | `/settings` | Language, notifications, account | P1 |
| **Offline State** | global | Graceful fallback when no internet | P2 |

---

## 13. API Contracts

### 13.1 Journey Search

```
POST /api/v1/journey/search

Request:
{
  "origin": {
    "text": "Saddar",
    "lat": 24.8607,
    "lng": 67.0105
  },
  "destination": {
    "text": "Gulshan-e-Iqbal",
    "lat": 24.9281,
    "lng": 67.0986
  },
  "language": "ur",
  "departure_time": "now"
}

Response:
{
  "journeys": [
    {
      "id": "j_001",
      "duration_minutes": 42,
      "transfers": 1,
      "fare_pkr": 60,
      "walk_minutes": 8,
      "legs": [
        {
          "mode": "WALK",
          "duration_minutes": 3,
          "instruction": "Walk to Saddar BRT Station",
          "distance_m": 250
        },
        {
          "mode": "BRT",
          "route_name": "Green Line",
          "departure_stop": "Saddar",
          "arrival_stop": "Nipa",
          "duration_minutes": 25,
          "fare_pkr": 30,
          "color": "#1A6B4A"
        },
        ...
      ],
      "source": "google_maps",
      "rag_augmented": false
    }
  ]
}
```

### 13.2 AI Prompt Parse

```
POST /api/v1/agent/parse

Request:
{
  "prompt": "mujhe Saddar se Gulshan jana hai",
  "language_hint": "roman_urdu"
}

Response:
{
  "origin": "Saddar",
  "destination": "Gulshan-e-Iqbal",
  "detected_language": "roman_urdu",
  "confidence": 0.94,
  "ambiguities": []
}
```

### 13.3 Voice Input

```
POST /api/v1/voice/transcribe

Request: multipart/form-data
  audio: [binary blob]
  language_hint: "ur-PK"

Response:
{
  "transcript": "مجھے صدر سے گلشن جانا ہے",
  "confidence": 0.88,
  "detected_language": "ur"
}
```

---

## 14. Data Models

### Journey

```typescript
interface Journey {
  id: string;
  origin: Location;
  destination: Location;
  legs: Leg[];
  duration_minutes: number;
  transfers: number;
  fare_pkr: number;
  walk_minutes: number;
  departure_time: Date;
  arrival_time: Date;
  source: 'google_maps' | 'rag' | 'hybrid';
}
```

### Leg

```typescript
interface Leg {
  mode: 'BRT' | 'BUS' | 'CHINCHI' | 'WALK';
  route_name?: string;
  route_number?: string;
  departure_stop?: Stop;
  arrival_stop?: Stop;
  duration_minutes: number;
  fare_pkr?: number;
  polyline?: string; // encoded Google Maps polyline
  steps?: Step[];
  color: string;
}
```

### Stop

```typescript
interface Stop {
  id: string;
  name_en: string;
  name_ur: string;
  lat: number;
  lng: number;
  modes: TransportMode[];
}
```

### RAG Document (Corpus Entry)

```typescript
interface RouteDocument {
  doc_id: string;
  route_number: string;
  operator: string;
  mode: 'BRT' | 'BUS' | 'CHINCHI';
  origin_terminal: string;
  destination_terminal: string;
  stops: string[]; // ordered stop names
  fare_pkr: number;
  frequency_minutes: number;
  operating_hours: string;
  last_verified: Date;
  source: string;
}
```

---

## 15. Non-Functional Requirements

### Performance

- First Contentful Paint (FCP): < 1.5s on 4G
- Time to Interactive (TTI): < 3s on 4G
- Journey search response: < 4s end-to-end
- Maps tile loading: standard Google Maps performance

### Availability

- Target uptime: 99.5%
- Graceful degradation to cached results when offline

### Accessibility

- WCAG 2.1 AA compliance
- Screen reader support (ARIA labels in Urdu and English)
- Minimum 4.5:1 contrast ratio for all text
- Voice navigation support throughout

### Localisation

- Languages: English, Urdu (Nastaliq), Roman Urdu
- Currency: PKR (Pakistani Rupee)
- Map labels: Bilingual where possible
- Time format: 12hr with AM/PM

### Security

- No PII stored beyond Firebase Auth UID
- Location data: processed client-side, not stored persistently
- All API keys restricted by HTTP referrer (Google Cloud Console)

---

## 16. Milestones & Phasing

### Phase 1 — MVP (Weeks 1–8)

- [ ] Google Stitch designs for Home, Results, Active Journey screens
- [ ] React frontend scaffolding (responsive, RTL-ready)
- [ ] Google Maps integration (Directions, Maps JS, Places Autocomplete)
- [ ] **Mnzl scraper** — Python scraper extracts all routes, stops, fares
- [ ] **Corpus cleaning script** — stitches stops into ordered route sequences
- [ ] Text input journey search (English only)
- [ ] Basic journey results display
- [ ] Active journey with live location

### Phase 2 — AI Layer (Weeks 9–14)

- [ ] Gemini API integration for prompt parsing
- [ ] **RAG corpus V1** — embed cleaned Mnzl scrape into Vertex AI Matching Engine
- [ ] Vertex AI Matching Engine setup + RAG retrieval tested end-to-end
- [ ] Roman Urdu + Urdu input support
- [ ] Voice input (Google Speech-to-Text)

### Phase 3 — Polish & Scale (Weeks 15–20)

- [ ] Saved journeys (Firebase Firestore)
- [ ] Journey alerts (geofence)
- [ ] Full Urdu RTL UI mode
- [ ] Onboarding flow
- [ ] PWA offline mode
- [ ] GA4 analytics integration
- [ ] **Mnzl re-scrape V2** — incremental update + user corrections ingested
- [ ] Firebase CLI deployment pipeline (Hosting + Firestore rules)

---

## 17. Open Questions

| # | Question | Owner | Priority | Status |
|---|---|---|---|---|
| 1 | ~~Does Google Maps Transit API have sufficient Karachi bus/BRT data?~~ | Tech | P0 | ✅ **Resolved** — Mnzl scrape is primary corpus; Maps API is secondary/fallback |
| 2 | ~~Legal/licensing status of Mnzl data for RAG corpus~~ | Legal | P0 | ✅ **Resolved (internal)** — scraping for non-commercial AI use accepted; do not republish raw data |
| 3 | Will Google Stitch export support RTL layouts natively? | Design | P0 | Open |
| 4 | Can Chinchi zones be modelled as a transit mode in the routing engine? | Tech | P1 | Open |
| 5 | What is the budget cap for Google Maps API calls per month? | Product | P1 | Open |
| 6 | How frequently does Mnzl update its data — what is the scrape refresh cadence needed? | Tech | P1 | Open |
| 7 | Is there an operator data partnership possible with KTC? | Business | P2 | Open |
| 8 | Should the app support offline-first routing for poor-connectivity areas? | Tech | P2 | Open |

---

*Spec Kit v1.1 — prepared for Antigravity × Musafir AI. RAG corpus sourced from Mnzl app scrape. Firebase deployed via CLI (no MCP required). All designs to be produced in Google Stitch and exported to production-ready React components. This spec is the single source of truth for layout, color tokens, component naming, and API contracts.*
