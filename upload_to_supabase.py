"""
upload_to_supabase.py
Reads musafir.db → uploads routes/stops to Supabase → generates embeddings via Gemini → stores in route_embeddings (pgvector)

Run:  python upload_to_supabase.py
"""
import sqlite3, os, time
from pathlib import Path
from dotenv import load_dotenv

# Load backend .env
load_dotenv(dotenv_path=Path(__file__).parent / "backend" / ".env")

from google import genai
from google.genai import types as genai_types
from supabase import create_client, Client

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gehrzlsyunmpbakyrkcc.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")   # service role for writes
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCGYsyBCx2bXqDtRZGtIuL1-nEd1iqT3vQ")
DB_PATH = os.path.join(os.path.dirname(__file__), "musafir.db")
EMBEDDING_MODEL = "gemini-embedding-exp-03-07"   # latest stable embedding model

# ── Init clients ──────────────────────────────────────────────────────────────
client = genai.Client(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def read_sqlite():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM transport_metadata")
    modes = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM stops")
    stops = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM routes")
    routes = [dict(r) for r in cur.fetchall()]

    # Build route → stop list lookup
    cur.execute("""
        SELECT rs.route_id, s.name_en
        FROM route_stops rs
        JOIN stops s ON s.stop_id = rs.stop_id
        ORDER BY rs.route_id, rs.sequence_order
    """)
    route_stop_map = {}
    for row in cur.fetchall():
        route_stop_map.setdefault(row[0], []).append(row[1])

    conn.close()
    return modes, stops, routes, route_stop_map


def build_knowledge_blob(route: dict, stops: list[str]) -> str:
    stops_text = " → ".join(stops) if stops else "No stop data"
    return (
        f"Route: {route['name']} ({route['mode_id'].replace('_', ' ').title()})\n"
        f"From: {route['origin']}  To: {route['destination']}\n"
        f"Total stops: {route['stop_count']}\n"
        f"Stops: {stops_text}\n"
        f"This {route['mode_id'].replace('_',' ')} is suitable for traveling from "
        f"{route['origin']} to {route['destination']} in Karachi."
    )


def get_embedding(text: str) -> list[float]:
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=genai_types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
    )
    return response.embeddings[0].values


def upload_modes(modes):
    print(f"Uploading {len(modes)} transport modes...")
    supabase.table("transport_metadata").upsert(modes, on_conflict="mode_id").execute()


def upload_stops(stops):
    print(f"Uploading {len(stops)} stops...")
    # Upload in batches of 100
    for i in range(0, len(stops), 100):
        batch = stops[i:i+100]
        supabase.table("stops").upsert(batch, on_conflict="stop_id").execute()
    print("  Stops done.")


def upload_routes(routes):
    print(f"Uploading {len(routes)} routes...")
    for i in range(0, len(routes), 50):
        batch = routes[i:i+50]
        supabase.table("routes").upsert(batch, on_conflict="route_id").execute()
    print("  Routes done.")


def upload_route_stops(routes, route_stop_map):
    print("Uploading route_stops...")
    # Rebuild from SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM route_stops")
    all_rs = [dict(r) for r in cur.fetchall()]
    conn.close()

    for i in range(0, len(all_rs), 200):
        batch = all_rs[i:i+200]
        supabase.table("route_stops").upsert(batch, on_conflict="path_id").execute()
    print(f"  {len(all_rs)} route_stops done.")


def upload_embeddings(routes, route_stop_map):
    print(f"Generating & uploading embeddings for {len(routes)} routes...")

    # Check which are already embedded
    existing = supabase.table("route_embeddings").select("route_id").execute()
    already_done = {r["route_id"] for r in existing.data}

    to_embed = [r for r in routes if r["route_id"] not in already_done]
    print(f"  {len(already_done)} already embedded, processing {len(to_embed)} new routes...")

    for i, route in enumerate(to_embed):
        stops = route_stop_map.get(route["route_id"], [])
        blob = build_knowledge_blob(route, stops)

        try:
            embedding = get_embedding(blob)
            record = {
                "route_id": route["route_id"],
                "content": blob,
                "embedding": embedding,
                "metadata": {
                    "name": route["name"],
                    "mode": route["mode_id"],
                    "origin": route["origin"],
                    "destination": route["destination"],
                }
            }
            supabase.table("route_embeddings").insert(record).execute()
            print(f"  [{i+1}/{len(to_embed)}] OK {route['name']}")
        except Exception as e:
            print(f"  [{i+1}/{len(to_embed)}] FAIL {route['name']}: {e}")

        # Rate limit: Gemini embed API allows ~1500 req/min
        if (i + 1) % 50 == 0:
            time.sleep(2)

    print("  Embeddings done.")


def main():
    if not SUPABASE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY environment variable first.")
        print("Get it from: https://supabase.com/dashboard/project/gehrzlsyunmpbakyrkcc/settings/api")
        return

    modes, stops, routes, route_stop_map = read_sqlite()

    upload_modes(modes)
    upload_stops(stops)
    upload_routes(routes)
    upload_route_stops(routes, route_stop_map)
    upload_embeddings(routes, route_stop_map)

    print("\nAll data uploaded to Supabase successfully!")
    print(f"   Modes: {len(modes)}")
    print(f"   Stops: {len(stops)}")
    print(f"   Routes: {len(routes)}")


if __name__ == "__main__":
    main()
