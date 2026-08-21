# main.py
import datetime
import urllib.parse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import pytz
from timezonefinder import TimezoneFinder

from calculations import calculate_kundali_data

app = FastAPI(title="Vedic & KP Kundali API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development and deployment flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tf = TimezoneFinder()

class ChartRequest(BaseModel):
    date_of_birth: str  # YYYY-MM-DD
    time_of_birth: str  # HH:MM:SS
    latitude: float
    longitude: float
    timezone_name: str  # e.g. "Asia/Kolkata"
    ayanamsa_system: str = "lahiri"  # "lahiri" or "newcomb"

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}

@app.get("/api/geocode")
def geocode_address(q: str):
    """
    Geocodes an address query using Nominatim and returns latitude,
    longitude, display name, and the timezone identifier.
    """
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
        
    encoded_query = urllib.parse.quote(q)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=5"
    headers = {
        "User-Agent": "AstroKundaliApp/1.0 (contact: nitin.developer@example.com)"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            raise HTTPException(status_code=404, detail="Location not found")
            
        results = []
        for item in data:
            lat = float(item["lat"])
            lon = float(item["lon"])
            
            # Lookup timezone name based on coords
            tz_name = tf.timezone_at(lng=lon, lat=lat) or "UTC"
            
            results.append({
                "display_name": item["display_name"],
                "latitude": lat,
                "longitude": lon,
                "timezone_name": tz_name
            })
            
        return {"results": results}
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Geocoding service error: {str(e)}")

@app.get("/api/timezone")
def resolve_timezone(lat: float, lon: float):
    """
    Looks up the timezone name (e.g. 'Asia/Kolkata') offline for given coordinates.
    """
    try:
        tz_name = tf.timezone_at(lng=lon, lat=lat) or "UTC"
        return {"timezone_name": tz_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timezone resolution failed: {str(e)}")

@app.post("/api/chart-data")
def get_chart_data(req: ChartRequest):
    """
    Computes Vedic Kundali, KP Cusps, planetary tables, and Vimshottari Dashas
    from input birth details.
    """
    try:
        # 1. Parse date and time in local timezone
        try:
            local_tz = pytz.timezone(req.timezone_name)
        except Exception:
            local_tz = pytz.UTC
            
        dob_parts = [int(x) for x in req.date_of_birth.split("-")]
        tob_parts = [int(x) for x in req.time_of_birth.split(":")]
        
        if len(dob_parts) != 3 or len(tob_parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid date or time format. Use YYYY-MM-DD and HH:MM:SS")
            
        local_dt = datetime.datetime(
            dob_parts[0], dob_parts[1], dob_parts[2],
            tob_parts[0], tob_parts[1], tob_parts[2]
        )
        
        # Localize and convert to UTC
        local_dt_localized = local_tz.localize(local_dt)
        utc_dt = local_dt_localized.astimezone(pytz.UTC)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Date/time parse error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request parameters: {str(e)}")
        
    try:
        # 2. Run calculations
        chart_result = calculate_kundali_data(utc_dt, req.latitude, req.longitude, req.ayanamsa_system)
        
        # Return results with request echo
        return {
            "input": {
                "date_of_birth": req.date_of_birth,
                "time_of_birth": req.time_of_birth,
                "latitude": req.latitude,
                "longitude": req.longitude,
                "timezone_name": req.timezone_name,
                "ayanamsa_system": req.ayanamsa_system,
                "utc_time": utc_dt.isoformat()
            },
            "result": chart_result
        }
    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Astrological calculation failure: {str(e)}\nTraceback:\n{tb_str}")
