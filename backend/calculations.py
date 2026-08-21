# calculations.py
import math
import datetime
import swisseph as swe

# Vimshottari Dasha configuration
VIMSHOTTARI_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
DASA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]  # Total = 120 years

# Sign configuration
RASI_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]
RASI_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
]

# Nakshatras names
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

def format_degrees(decimal_deg):
    """Converts decimal degrees to D° M' S" string format."""
    deg = int(decimal_deg)
    rem_min = (decimal_deg - deg) * 60
    minutes = int(rem_min)
    seconds = int(round((rem_min - minutes) * 60))
    # Handle rounding overflows
    if seconds >= 60:
        seconds = 0
        minutes += 1
    if minutes >= 60:
        minutes = 0
        deg += 1
    return f"{deg}° {minutes:02d}' {seconds:02d}\""

def get_dasa_index(lord_name):
    """Returns the index of a planet in Vimshottari order."""
    return VIMSHOTTARI_LORDS.index(lord_name)

def get_kp_segment_helper(span_min, target_offset_min, start_lord_idx):
    """
    Divides a given span (in minutes of arc) into 9 subdivisions proportional
    to the Vimshottari Dasha years starting from start_lord_idx.
    Returns: (lord_name, offset_within_segment, segment_span, lord_idx)
    """
    total_dasa_years = 120.0
    current_sum = 0.0
    
    for i in range(9):
        lord_idx = (start_lord_idx + i) % 9
        lord_years = DASA_YEARS[lord_idx]
        segment_span = span_min * (lord_years / total_dasa_years)
        
        if target_offset_min <= (current_sum + segment_span + 1e-9):
            lord_name = VIMSHOTTARI_LORDS[lord_idx]
            offset_within = target_offset_min - current_sum
            if offset_within < 0:
                offset_within = 0.0
            return lord_name, offset_within, segment_span, lord_idx
            
        current_sum += segment_span
        
    # Fallback to the last lord if float precision edge case
    last_idx = (start_lord_idx + 8) % 9
    return VIMSHOTTARI_LORDS[last_idx], target_offset_min - (current_sum - segment_span), segment_span, last_idx

def calculate_lords_hierarchy(longitude):
    """
    Computes KP lords (Sign Lord, Star Lord, Sub Lord, Sub-Sub Lord, Sub-Sub-Sub Lord)
    for a given longitude (0 to 360 degrees).
    """
    longitude = longitude % 360.0
    
    # 1. Sign Lord
    sign_idx = int(longitude // 30.0)
    sign_name = RASI_NAMES[sign_idx]
    sign_lord = RASI_LORDS[sign_idx]
    
    # 2. Star Lord (Nakshatra)
    nak_span_deg = 13.333333333333334  # 13° 20' = 800 minutes
    nak_idx = int(longitude // nak_span_deg)
    nak_name = NAKSHATRAS[nak_idx % 27]
    star_lord = VIMSHOTTARI_LORDS[nak_idx % 9]
    pada = int((longitude % nak_span_deg) // 3.3333333333333335) + 1
    
    # Minutes offset inside Nakshatra
    nak_offset_min = (longitude % nak_span_deg) * 60.0
    
    # 3. Sub Lord
    sub_lord, sub_offset, sub_span, sub_idx = get_kp_segment_helper(800.0, nak_offset_min, nak_idx % 9)
    
    # 4. Sub-Sub Lord (SSL)
    ssl_lord, ssl_offset, ssl_span, ssl_idx = get_kp_segment_helper(sub_span, sub_offset, sub_idx)
    
    # 5. Sub-Sub-Sub Lord (SSSL)
    sssl_lord, sssl_offset, sssl_span, sssl_idx = get_kp_segment_helper(ssl_span, ssl_offset, ssl_idx)
    
    return {
        "longitude": longitude,
        "formatted": format_degrees(longitude),
        "sign": sign_name,
        "sign_lord": sign_lord,
        "nakshatra": nak_name,
        "star_lord": star_lord,
        "pada": pada,
        "sub_lord": sub_lord,
        "sub_sub_lord": ssl_lord,
        "sub_sub_sub_lord": sssl_lord
    }

def calculate_vimshottari_dasha(moon_longitude, birth_dt):
    """
    Computes a highly accurate 3-level Vimshottari Dasha timeline
    starting from birth date/time based on the Moon's sidereal longitude.
    """
    moon_longitude = moon_longitude % 360.0
    nak_span_deg = 13.333333333333334
    
    nak_idx = int(moon_longitude // nak_span_deg)
    pos_in_nak = moon_longitude % nak_span_deg
    
    # Start Lord in Vimshottari order
    start_lord_idx = nak_idx % 9
    elapsed_fraction = pos_in_nak / nak_span_deg
    remaining_fraction = 1.0 - elapsed_fraction
    
    # Length of start Mahadasha in days (365.25 days/year)
    start_lord_years = DASA_YEARS[start_lord_idx]
    balance_days = remaining_fraction * start_lord_years * 365.25
    
    timeline = []
    current_start = birth_dt
    
    # Loop over 9 Mahadashas (covering a full 120-year cycle)
    for i in range(9):
        lord_idx = (start_lord_idx + i) % 9
        lord_name = VIMSHOTTARI_LORDS[lord_idx]
        
        # Calculate duration of this Mahadasha
        if i == 0:
            md_duration_days = balance_days
        else:
            md_duration_days = DASA_YEARS[lord_idx] * 365.25
            
        current_end = current_start + datetime.timedelta(days=md_duration_days)
        
        # Level 1: Maha Dasha details
        md_node = {
            "lord": lord_name,
            "start": current_start.isoformat(),
            "end": current_end.isoformat(),
            "level": 1,
            "antardashas": []
        }
        
        # Level 2: Antar Dashas (Bhuktis)
        # Antardashas start with the Mahadasha lord itself and follow the cycle
        ad_start = current_start
        for j in range(9):
            ad_lord_idx = (lord_idx + j) % 9
            ad_lord_name = VIMSHOTTARI_LORDS[ad_lord_idx]
            
            # Antardasha duration is proportional to its Vimshottari ratio
            ad_duration_days = md_duration_days * (DASA_YEARS[ad_lord_idx] / 120.0)
            ad_end = ad_start + datetime.timedelta(days=ad_duration_days)
            
            ad_node = {
                "lord": ad_lord_name,
                "start": ad_start.isoformat(),
                "end": ad_end.isoformat(),
                "level": 2,
                "pratyantardashas": []
            }
            
            # Level 3: Pratyantar Dashas
            pd_start = ad_start
            for k in range(9):
                pd_lord_idx = (ad_lord_idx + k) % 9
                pd_lord_name = VIMSHOTTARI_LORDS[pd_lord_idx]
                
                pd_duration_days = ad_duration_days * (DASA_YEARS[pd_lord_idx] / 120.0)
                pd_end = pd_start + datetime.timedelta(days=pd_duration_days)
                
                ad_node["pratyantardashas"].append({
                    "lord": pd_lord_name,
                    "start": pd_start.isoformat(),
                    "end": pd_end.isoformat(),
                    "level": 3
                })
                
                pd_start = pd_end
                
            md_node["antardashas"].append(ad_node)
            ad_start = ad_end
            
        timeline.append(md_node)
        current_start = current_end
        
    return timeline

def calculate_kundali_data(utc_dt, lat, lon, ayanamsa_system="lahiri"):
    """
    Computes sidereal planetary positions, Placidus house cusps (KP),
    and Rasi chart mapping using Swiss Ephemeris.
    """
    # Convert UTC datetime to Julian Date
    hour_utc = utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0
    jd_ut = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, hour_utc)
    
    # 1. Set Sidereal Mode
    if ayanamsa_system == "newcomb":
        # In Swiss Ephemeris, SIDM_KRISHNAMURTI_VP291 represents the "KP New" (Senthilathiban) Ayanamsha system
        # which yields exactly 24° 08' 18" for 2026.
        if hasattr(swe, "SIDM_KRISHNAMURTI_VP291"):
            swe.set_sid_mode(swe.SIDM_KRISHNAMURTI_VP291, 0.0, 0.0)
        else:
            # Fallback to standard Krishnamurti (SIDM_KRISHNAMURTI = 5)
            swe.set_sid_mode(5, 0.0, 0.0)
    else:
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0.0, 0.0)
        
    # Calculate Ayanamsa offset
    ayanamsa = swe.get_ayanamsa_ut(jd_ut)
    
    # 2. Calculate Planets (Sun = 0, Moon = 1, Mercury = 2, Venus = 3, Mars = 4, Jupiter = 5, Saturn = 6)
    planet_ids = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mars": swe.MARS,
        "Mercury": swe.MERCURY,
        "Jupiter": swe.JUPITER,
        "Venus": swe.VENUS,
        "Saturn": swe.SATURN,
        "Rahu": swe.MEAN_NODE  # KP and Vedic use Mean Node by default
    }
    
    planets_data = {}
    
    for name, swe_id in planet_ids.items():
        res = swe.calc_ut(jd_ut, swe_id, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
        sidereal_long = res[0][0]
        speed = res[0][3]
        
        # Retrogression
        retrograde = "R" if speed < 0 else "D"
        if name == "Rahu":
            retrograde = "R"  # Rahu is generally retrograde
            
        # Get hierarchy of lords
        lords = calculate_lords_hierarchy(sidereal_long)
        lords["retrograde"] = retrograde
        planets_data[name] = lords
        
    # Calculate Ketu (180 degrees opposite Rahu)
    rahu_sidereal = planets_data["Rahu"]["longitude"]
    ketu_sidereal = (rahu_sidereal + 180.0) % 360.0
    ketu_lords = calculate_lords_hierarchy(ketu_sidereal)
    ketu_lords["retrograde"] = "R"
    planets_data["Ketu"] = ketu_lords
    
    # 3. Calculate Placidus Houses (KP Cusps)
    # Placidus system is 'P', passing FLG_SIDEREAL calculates sidereal directly
    cusps, ascmc = swe.houses_ex(jd_ut, lat, lon, b'P', swe.FLG_SWIEPH | swe.FLG_SIDEREAL)
    
    # Ascendant
    asc_sidereal = ascmc[0]
    asc_lords = calculate_lords_hierarchy(asc_sidereal)
    
    # 12 Placidus Cusps
    cusps_data = []
    for i in range(12):
        sidereal_cusp = cusps[i]  # 0-indexed in pyswisseph (representing houses 1 to 12)
        lords = calculate_lords_hierarchy(sidereal_cusp)
        lords["cusp_number"] = i + 1
        cusps_data.append(lords)
        
    # 4. Vedic Rasi Chart (D1) Placement
    # In Vedic Rasi Chart, houses are sign-based starting from the Ascendant sign.
    asc_sign_idx = int(asc_sidereal // 30.0)
    
    # Create structure for Vedic houses relative to Ascendant
    # House 1 starts at Ascendant sign.
    vedic_houses = {}
    for house_num in range(1, 13):
        house_sign_idx = (asc_sign_idx + house_num - 1) % 12
        vedic_houses[house_num] = {
            "sign": RASI_NAMES[house_sign_idx],
            "sign_lord": RASI_LORDS[house_sign_idx],
            "planets": []
        }
        
    # Place planets in Vedic houses
    for p_name, p_val in planets_data.items():
        p_long = p_val["longitude"]
        p_sign_idx = int(p_long // 30.0)
        # Find which house relative to Ascendant (1 to 12)
        rel_house = (p_sign_idx - asc_sign_idx) % 12 + 1
        vedic_houses[rel_house]["planets"].append(p_name)
        
    # 4b. KP Cuspal House Placement
    # In KP system, a planet is placed in a house based on whether its longitude
    # falls between cusp i and cusp i+1.
    kp_houses = {}
    for house_num in range(1, 13):
        cusp = cusps_data[house_num - 1]
        kp_houses[house_num] = {
            "sign": cusp["sign"],
            "sign_lord": cusp["sign_lord"],
            "planets": []
        }
        
    for p_name, p_val in planets_data.items():
        p_long = p_val["longitude"]
        
        # Determine which house (1 to 12) the planet falls in
        planet_house = 1 # Fallback
        for i in range(12):
            c_start = cusps_data[i]["longitude"]
            c_end = cusps_data[(i + 1) % 12]["longitude"]
            
            is_inside = False
            if c_start < c_end:
                if c_start <= p_long < c_end:
                    is_inside = True
            else: # Houses crosses 0/360 boundary
                if p_long >= c_start or p_long < c_end:
                    is_inside = True
                    
            if is_inside:
                planet_house = i + 1
                break
                
        kp_houses[planet_house]["planets"].append(p_name)
        
    # 5. Vimshottari Dasha
    moon_long = planets_data["Moon"]["longitude"]
    dasha_timeline = calculate_vimshottari_dasha(moon_long, utc_dt)
    
    # 5b. NP Astrology Calculations
    # Find currently running Mahadasha Lord
    now_utc_aware = datetime.datetime.now(datetime.timezone.utc)
    dasha_lord = VIMSHOTTARI_LORDS[0] # Default fallback
    for md in dasha_timeline:
        try:
            start_dt = datetime.datetime.fromisoformat(md["start"])
            end_dt = datetime.datetime.fromisoformat(md["end"])
            if start_dt <= now_utc_aware <= end_dt:
                dasha_lord = md["lord"]
                break
        except Exception:
            continue
            
    # Planet Roles Table
    # For every planet, collect list of cusp numbers where this planet is the Sub Lord
    planet_roles = {}
    for p_name in VIMSHOTTARI_LORDS:
        planet_roles[p_name] = []
        
    for idx, cusp in enumerate(cusps_data):
        c_sub_lord = cusp["sub_lord"]
        if c_sub_lord in planet_roles:
            planet_roles[c_sub_lord].append(idx + 1)
            
    # Fallback: if a planet is not the sub-lord of any cusp,
    # use the KP house number in which that planet is placed.
    for p_name in VIMSHOTTARI_LORDS:
        if not planet_roles[p_name]:
            placed_house = 1
            for house_num, house_data in kp_houses.items():
                if p_name in house_data["planets"]:
                    placed_house = house_num
                    break
            planet_roles[p_name] = [placed_house]
            
    # Cuspal Significators Table
    # 12 cusps:
    # row 1: Sub Lord of the sign lord (ruler) of the cusp
    # row 2: Star Lord of the sign lord (ruler) of the cusp (if ruler is Moon, Star Lord becomes dasha_lord!)
    # row 3: Sub Lord of the cusp itself
    cuspal_significators = []
    for idx, cusp in enumerate(cusps_data):
        sign_lord = cusp["sign_lord"]
        
        # Row 1 value
        row1_val = planets_data.get(sign_lord, {}).get("sub_lord", "")
        
        # Row 2 value
        if sign_lord == "Moon":
            row2_val = dasha_lord
        else:
            row2_val = planets_data.get(sign_lord, {}).get("star_lord", "")
            
        # Row 3 value
        row3_val = cusp["sub_lord"]
        
        cuspal_significators.append({
            "cusp_number": idx + 1,
            "sign_lord": sign_lord,
            "row1_sub_lord_of_sign_lord": row1_val,
            "row2_star_lord_of_sign_lord": row2_val,
            "row3_sub_lord_of_cusp": row3_val
        })
        
    # Clean up swisseph files/cache
    swe.close()
    
    return {
        "ayanamsa": ayanamsa,
        "ayanamsa_formatted": format_degrees(ayanamsa),
        "ascendant": asc_lords,
        "planets": planets_data,
        "cusps": cusps_data,
        "vedic_houses": vedic_houses,
        "kp_houses": kp_houses,
        "dasha": dasha_timeline,
        "np_astrology": {
            "current_dasha_lord": dasha_lord,
            "planet_roles": planet_roles,
            "cuspal_significators": cuspal_significators
        }
    }
