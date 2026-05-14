"""
main.py — Musafir AI FastAPI Backend
- /api/search-routes    → RAG semantic search via pgvector
- /api/stop-search      → Fast stop name autocomplete
- /api/route/:id        → Full route details + stop list
- /api/ai-guidance      → Gemini Pro journey summary

Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend folder
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

import google.generativeai as genai_legacy   # keep for GenerativeModel fallback
from google import genai
from google.genai import types as genai_types
from supabase import create_client, Client

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gehrzlsyunmpbakyrkcc.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")          # anon key is fine for reads
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCGYsyBCx2bXqDtRZGtIuL1-nEd1iqT3vQ")
EMBED_MODEL = "gemini-embedding-exp-03-07"

genai_legacy.configure(api_key=GEMINI_API_KEY)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Musafir AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    limit: int = 5

class GuidanceRequest(BaseModel):
    origin: str
    destination: str
    routes: list[dict] = []


# ── Helpers ───────────────────────────────────────────────────────────────────
def embed(text: str) -> list[float]:
    result = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Musafir AI"}


@app.post("/api/search-routes")
async def search_routes(req: SearchRequest):
    """
    Semantic RAG search: embed the query → pgvector cosine similarity → return matching routes.
    Much faster than calling Gemini for every search.
    """
    # Build query text from what the user gave us
    query_text = req.query
    if req.origin and req.destination:
        query_text = f"route from {req.origin} to {req.destination}"
    elif req.origin:
        query_text = f"bus route from {req.origin}"
    elif req.destination:
        query_text = f"route to {req.destination}"

    try:
        res = gemini_client.models.embed_content(
            model="text-embedding-004",
            contents=query_text
        )
        query_embedding = res.embeddings[0].values
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # Call the pgvector search function
    try:
        result = supabase.rpc("search_routes", {
            "query_embedding": query_embedding,
            "match_count": req.limit,
            "similarity_threshold": 0.05, # Lowered threshold to show more results
        }).execute()
        routes = result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector search failed: {e}")

    return {"routes": routes, "query": query_text, "count": len(routes)}


@app.get("/api/stop-search")
async def stop_search(q: str = Query(..., min_length=2), limit: int = 10):
    """
    Fast stop name search — used for location autocomplete overlay with local data.
    Responds in <50ms (pure SQL ILIKE, no AI).
    """
    try:
        result = supabase.rpc("search_stops", {
            "query": q,
            "max_results": limit,
        }).execute()
        stops = result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"stops": stops, "count": len(stops)}


@app.get("/api/route/{route_id}")
async def get_route(route_id: str):
    """Full route details with ordered stop list."""
    try:
        route_res = supabase.table("routes").select("*").eq("route_id", route_id).single().execute()
        if not route_res.data:
            raise HTTPException(status_code=404, detail="Route not found")

        stops_res = (
            supabase.table("route_stops")
            .select("sequence_order, stops(stop_id, name_en, latitude, longitude)")
            .eq("route_id", route_id)
            .order("sequence_order")
            .execute()
        )

        return {
            "route": route_res.data,
            "stops": [s["stops"] for s in (stops_res.data or [])],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai-guidance")
async def ai_guidance(req: GuidanceRequest):
    """
    Gemini 2.0 Flash — rich journey narrative with local Karachi knowledge.
    Combines RAG-retrieved routes with AI generation.
    """
    routes_text = "\n".join([
        f"- {r.get('name','?')} ({r.get('mode_id','?')}): "
        f"{r.get('origin','?')} → {r.get('destination','?')}  [similarity: {r.get('similarity',0):.2f}]"
        for r in req.routes
    ]) or "No matching routes found in database."

    prompt = f"""You are a Karachi public transport expert. A commuter needs to travel:
FROM: {req.origin}
TO: {req.destination}

Matching routes from database:
{routes_text}

Give a concise, practical journey plan (2-3 sentences) covering:
1. Best route option (bus number or BRT line)
2. Approximate travel time and fare in PKR
3. One local tip (landmark stop, peak-hour advice, or transfer point)

Be friendly and specific to Karachi. Reply in plain text only."""

    try:
        # Use the modern google-genai client
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )
        return {"guidance": response.text, "model": "gemini-2.5-flash-lite"}
    except Exception as e:
        print(f"AI Guidance error: {e}")
        # Fallback to flash-latest
        try:
            response = gemini_client.models.generate_content(
                model="gemini-1.5-flash-latest",
                contents=prompt
            )
            return {"guidance": response.text, "model": "gemini-1.5-flash-latest"}
        except Exception as e2:
            raise HTTPException(status_code=500, detail=str(e2))


@app.get("/api/routes")
async def list_routes(
    mode: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List all routes, optionally filtered by transport mode."""
    try:
        q = supabase.table("routes").select("*")
        if mode:
            q = q.eq("mode_id", mode)
        result = q.range(offset, offset + limit - 1).execute()
        return {"routes": result.data, "count": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
