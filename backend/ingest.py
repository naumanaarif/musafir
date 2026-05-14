import json
import os
import re
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import TransportMetadata, Stop, Route, RouteStop

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def slugify(text):
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def create_knowledge_blob(vehicle_name, vehicle_type, starting_point, ending_point, station_list):
    stops_str = ", ".join(station_list)
    blob = f"{vehicle_name} is a {vehicle_type} traveling from {starting_point} to {ending_point}. Key stops include: {stops_str}. It is ideal for reaching {ending_point} cheaply."
    return blob

def ingest_data(file_path):
    print(f"Loading data from {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    db: Session = SessionLocal()
    
    try:
        # We will keep track of processed modes and stops to avoid unnecessary redundant queries
        processed_modes = set()
        processed_stops = set()
        
        route_count = 0
        
        for item in data:
            vehicle_name = item.get("Vehicle Name", "Unknown")
            vehicle_url = item.get("Vehicle URL", "")
            vehicle_image = item.get("Vehicle Image", "")
            vehicle_type = item.get("Vehicle Type", "Unknown")
            total_stops_str = item.get("Total Stops", "0")
            
            try:
                stop_count = int(total_stops_str)
            except ValueError:
                stop_count = 0
                
            starting_point = item.get("Starting Point", "")
            ending_point = item.get("Ending Point", "")
            station_list_raw = item.get("Station List", "")
            
            # Split by newline
            station_list = [s.strip() for s in station_list_raw.split('\n') if s.strip()]
            
            # 1. TransportMetadata
            mode_id = slugify(vehicle_type)
            if not mode_id:
                mode_id = "unknown"
                
            if mode_id not in processed_modes:
                # Check if exists
                existing_mode = db.query(TransportMetadata).filter_by(mode_id=mode_id).first()
                if existing_mode is None:
                    new_mode = TransportMetadata(
                        mode_id=mode_id,
                        display_name=vehicle_type,
                        category=vehicle_type,
                        base_fare=0
                    )
                    db.add(new_mode)
                    db.commit()
                processed_modes.add(mode_id)
            
            # 2. Route
            route_id = slugify(vehicle_name)
            if not route_id:
                continue
                
            # Check if route already exists (skip duplicates if any)
            existing_route = db.query(Route).filter_by(route_id=route_id).first()
            if existing_route:
                continue
                
            new_route = Route(
                route_id=route_id,
                mode_id=mode_id,
                name=vehicle_name,
                origin=starting_point,
                destination=ending_point,
                stop_count=stop_count,
                source_url=vehicle_url,
                image_url=vehicle_image
            )
            db.add(new_route)
            
            # Flush to ensure route_id is available if needed (though it's manually assigned)
            db.flush()
            
            # 3. Stops & RouteStops
            for idx, station_name in enumerate(station_list):
                stop_id = slugify(station_name)
                if not stop_id:
                    continue
                    
                if stop_id not in processed_stops:
                    existing_stop = db.query(Stop).filter_by(stop_id=stop_id).first()
                    if existing_stop is None:
                        new_stop = Stop(
                            stop_id=stop_id,
                            name_en=station_name,
                            name_ur="",
                            latitude=None,
                            longitude=None
                        )
                        db.add(new_stop)
                    processed_stops.add(stop_id)
                
                # Create RouteStop
                path_id = f"{route_id}_{stop_id}_{idx+1}"
                new_route_stop = RouteStop(
                    path_id=path_id,
                    route_id=route_id,
                    stop_id=stop_id,
                    sequence_order=idx + 1
                )
                db.add(new_route_stop)
            
            # Commit the route and its stops
            db.commit()
            route_count += 1
            
            # Optional: Generate knowledge blob just to show we can
            # blob = create_knowledge_blob(vehicle_name, vehicle_type, starting_point, ending_point, station_list)
            
        print(f"Ingestion complete. Processed {route_count} routes successfully.")
        
    except Exception as e:
        print(f"Error during ingestion: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_file = os.path.join(BASE_DIR, 'data', 'mnzil_scrapedata.json')
    if os.path.exists(data_file):
        ingest_data(data_file)
    else:
        print(f"Error: Data file not found at {data_file}")
