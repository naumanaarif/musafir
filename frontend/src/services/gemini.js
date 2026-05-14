import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Backend URL — FastAPI on port 8000
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ── Flash-Lite: fast intent/NLU parsing (voice & text prompts) ──────────────
export async function parseJourneyPrompt(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const result = await model.generateContent(`
You are a transit assistant for Karachi, Pakistan. Parse the following journey request.

User input: "${prompt}"

Known Karachi areas include: Saddar, Gulshan-e-Iqbal, Clifton, DHA, North Nazimabad,
Malir, Korangi, Landhi, Orangi, Liaquatabad, SITE Area, Surjani, Shah Faisal Colony,
Airport, Port Qasim, Nipa Chowrangi, Numaish, Teen Talwar, Empress Market, Tariq Road.

Respond ONLY with valid JSON (no markdown, no explanation):
{"origin": "area name", "destination": "area name", "language": "en|ur|roman_ur", "confidence": 0.9}

If origin or destination cannot be determined, use null for that field.
`);

  try {
    const text = result.response.text().trim()
      .replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return { origin: null, destination: null, confidence: 0 };
  }
}

// ── RAG Route Search: backend pgvector search → fast & local-data-aware ──────
export async function searchRoutesRAG(origin, destination) {
  try {
    const res = await fetch(`${API_BASE}/api/search-routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `route from ${origin} to ${destination}`,
        origin,
        destination,
        limit: 5,
      }),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return await res.json();   // { routes: [...], count: N }
  } catch (err) {
    console.warn('RAG search unavailable, skipping:', err.message);
    return { routes: [], count: 0 };
  }
}

// ── Stop search: fast autocomplete from local DB ─────────────────────────────
export async function searchStops(query) {
  try {
    const res = await fetch(`${API_BASE}/api/stop-search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return await res.json();   // { stops: [{stop_id, name_en, route_count}] }
  } catch {
    return { stops: [] };
  }
}

// ── Gemini 2.5 Pro via backend (RAG-augmented guidance) ──────────────────────
export async function getJourneyGuidance(origin, destination, legs = []) {
  // 1. Try backend (RAG-enhanced, faster, cheaper)
  try {
    const ragData = await searchRoutesRAG(origin, destination);

    const res = await fetch(`${API_BASE}/api/ai-guidance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        routes: ragData.routes || [],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.guidance;
    }
  } catch {
    // Fall through to direct Gemini
  }

  // 2. Fallback: direct Gemini 2.5 Pro call (if backend is offline)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const legsText = legs.length
    ? legs.map((l, i) => `${i + 1}. ${l.instructions} (${l.duration || ''})`).join('\n')
    : 'Route data not available — using local knowledge.';

  const result = await model.generateContent(`
You are a knowledgeable Karachi public transport guide. A commuter is traveling from "${origin}" to "${destination}".

Google Maps route steps:
${legsText}

Provide a friendly, practical 2–3 sentence summary covering:
- Recommended transport (BRT Green Line, bus route numbers, Chinchi rickshaw zones)
- Approximate total travel time and fare in PKR
- One practical local tip (e.g. peak hour warning, landmark stops)

Be concise and helpful. Respond in plain text only.
`);

  return result.response.text();
}

// ── Flash-Lite: quick Urdu / Roman Urdu / English detection ─────────────────
export async function detectLanguage(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  const result = await model.generateContent(
    `Detect the language of this text. Reply with ONLY one word: "en", "ur", or "roman_ur".\nText: "${text}"`
  );
  return result.response.text().trim().toLowerCase();
}
