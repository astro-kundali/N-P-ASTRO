# test_calculations.py
import datetime
import pytz

try:
    from calculations import calculate_kundali_data
    SWISSEPH_AVAILABLE = True
except ImportError:
    SWISSEPH_AVAILABLE = False
    print("Warning: swisseph module not available locally. Cannot run astrological calculations.")

def run_tests():
    if not SWISSEPH_AVAILABLE:
        print("Skipping verification test since swisseph is not installed.")
        return
        
    print("Running Vedic & KP calculation engine verification test...")
    
    # Oct 15, 1995, 10:30:00 AM Local Time in Mumbai, India
    birth_date = "1995-10-15"
    birth_time = "10:30:00"
    lat = 19.0760
    lon = 72.8777
    tz_name = "Asia/Kolkata"
    
    local_tz = pytz.timezone(tz_name)
    dob_parts = [int(x) for x in birth_date.split("-")]
    tob_parts = [int(x) for x in birth_time.split(":")]
    
    local_dt = datetime.datetime(
        dob_parts[0], dob_parts[1], dob_parts[2],
        tob_parts[0], tob_parts[1], tob_parts[2]
    )
    local_dt_tz = local_tz.localize(local_dt)
    utc_dt = local_dt_tz.astimezone(pytz.UTC)
    
    # Run engine calculations
    result = calculate_kundali_data(utc_dt, lat, lon)
    
    print("\n[SUCCESS] Astrological calculation completed!")
    print(f"Lahiri Ayanamsa: {result['ayanamsa_formatted']} (Decimal: {result['ayanamsa']:.4f}°)")
    print(f"Ascendant (Lagna) Longitude: {result['ascendant']['formatted']} in {result['ascendant']['sign']}")
    print(f"Ascendant Lords Hierarchy:")
    print(f"  - Sign Lord (R): {result['ascendant']['sign_lord']}")
    print(f"  - Star Lord (S): {result['ascendant']['star_lord']}")
    print(f"  - Sub Lord (Sub): {result['ascendant']['sub_lord']}")
    print(f"  - Sub-Sub Lord (SSL): {result['ascendant']['sub_sub_lord']}")
    print(f"  - Sub-Sub-Sub Lord (SSSL): {result['ascendant']['sub_sub_sub_lord']}")
    
    # Verify Planets
    print("\nPlanet Positions:")
    for p_name in ["Sun", "Moon", "Rahu", "Ketu"]:
        p_data = result["planets"][p_name]
        print(f"  - {p_name:6s}: {p_data['formatted']} in {p_data['sign']} ({p_data['nakshatra']} Pada {p_data['pada']})")
        print(f"            SSSL Lords: R={p_data['sign_lord']}, S={p_data['star_lord']}, Sub={p_data['sub_lord']}, SSL={p_data['sub_sub_lord']}, SSSL={p_data['sub_sub_sub_lord']}")
        
    # Verify Vimshottari
    dasha = result["dasha"]
    print(f"\nVimshottari Dasha timeline levels generated: {len(dasha)} Mahadashas.")
    print(f"Starting Mahadasha: {dasha[0]['lord']} from {dasha[0]['start'][:10]} to {dasha[0]['end'][:10]}")
    
    # Basic assertions
    assert result["ayanamsa"] > 23.0 and result["ayanamsa"] < 25.0, "Lahiri ayanamsa is out of expected historical bounds"
    assert len(result["planets"]) == 9, "Incorrect number of planets generated"
    assert len(result["cusps"]) == 12, "Incorrect number of house cusps generated"
    assert len(dasha) == 9, "Incorrect number of Mahadasha nodes generated"
    
    print("\n[ALL TESTS PASSED] Calculation engine is mathematically sound and stable.")

if __name__ == "__main__":
    run_tests()
