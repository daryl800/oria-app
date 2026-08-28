# bazi.py

import math
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import sxtwl
from typing import Optional, Dict, List, Tuple

# =====================================================
# Heavenly Stems & Earthly Branches
# =====================================================
GAN = ["Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"]
ZHI = ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"]

GAN_CN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
ZHI_CN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

GAN_MAP = {
    "en": ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"],
    "cn": ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
}

ZHI_MAP = {
    "en": ["Zi","Chou","Yin","Mao","Chen","Si","Wu","Wei","Shen","You","Xu","Hai"],
    "cn": ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
}

# =====================================================
# Element & Polarity Constants (module-level, shared by advanced calculations)
# =====================================================

# Heavenly stem → Five Element
GAN_ELEMENT: Dict[str, str] = {
    "Jia": "Wood", "Yi":   "Wood",
    "Bing": "Fire", "Ding": "Fire",
    "Wu":  "Earth", "Ji":  "Earth",
    "Geng": "Metal", "Xin": "Metal",
    "Ren": "Water", "Gui": "Water",
}

# Heavenly stem → polarity (index 0,2,4,6,8 = yang; 1,3,5,7,9 = yin)
GAN_POLARITY: Dict[str, str] = {
    "Jia": "yang", "Yi":   "yin",
    "Bing": "yang", "Ding": "yin",
    "Wu":  "yang", "Ji":  "yin",
    "Geng": "yang", "Xin": "yin",
    "Ren": "yang", "Gui": "yin",
}

# Generation cycle: key → generates → value
ELEM_GENERATES: Dict[str, str] = {
    "Wood": "Fire", "Fire": "Earth", "Earth": "Metal",
    "Metal": "Water", "Water": "Wood",
}

# Control cycle: key → controls → value
ELEM_CONTROLS: Dict[str, str] = {
    "Wood": "Earth", "Earth": "Water", "Water": "Fire",
    "Fire": "Metal", "Metal": "Wood",
}

# Month branch dominant qi (主氣/司令) — determines seasonal strength
MONTH_BRANCH_QI: Dict[str, str] = {
    "Zi": "Water", "Chou": "Earth",
    "Yin": "Wood",  "Mao": "Wood",
    "Chen": "Earth", "Si": "Fire",
    "Wu":  "Fire",  "Wei": "Earth",
    "Shen": "Metal", "You": "Metal",
    "Xu":  "Earth",  "Hai": "Water",
}

# Hidden stems per earthly branch with strength weights (module-level for reuse)
# Defined locally in the calculation functions too — kept in sync intentionally
ZHI_HIDDEN: Dict[str, List[Tuple[str, float]]] = {
    "Zi":   [("Ren", 1.0)],
    "Chou": [("Ji", 0.6), ("Gui", 0.3), ("Xin", 0.1)],
    "Yin":  [("Jia", 0.6), ("Bing", 0.3), ("Wu", 0.1)],
    "Mao":  [("Yi", 1.0)],
    "Chen": [("Wu", 0.6), ("Yi", 0.3), ("Gui", 0.1)],
    "Si":   [("Bing", 0.6), ("Wu", 0.3), ("Geng", 0.1)],
    "Wu":   [("Ding", 0.6), ("Ji", 0.4)],
    "Wei":  [("Ji", 0.6), ("Yi", 0.3), ("Ding", 0.1)],
    "Shen": [("Geng", 0.6), ("Ren", 0.3), ("Wu", 0.1)],
    "You":  [("Xin", 1.0)],
    "Xu":   [("Wu", 0.6), ("Xin", 0.3), ("Ding", 0.1)],
    "Hai":  [("Ren", 0.6), ("Jia", 0.4)],
}

# =====================================================
# Longitude Strategy
# =====================================================
LOCATION_LON_TABLE = {
    "hong kong": 114.1095,
    "taipei": 121.5654,
    "beijing": 116.4074,
    "shanghai": 121.4737,
    "new york": -74.0060,
    "los angeles": -118.2437,
    "san francisco": -122.4194,
    "chicago": -87.6298,
    "sydney": 151.2093,
    "melbourne": 144.9631,
    "brisbane": 153.0251,
    "perth": 115.8605,
    "paris": 2.3522,
    "rome": 12.4964,
    "milan": 9.1900,
    "berlin": 13.4050,
    "munich": 11.5820,
    "stockholm": 18.06,
}

REGION_LON_FALLBACK = {
    "china": 120.0,
    "taiwan": 121.0,
    "japan": 138.0,
    "usa": -95.0,
    "united states": -95.0,
    "australia": 133.0,
    "france": 2.0,
    "italy": 12.0,
    "germany": 10.0,
    "europe": 10.0,
    "asia": 120.0,
}

GLOBAL_DEFAULT_LON = 120.0

def resolve_longitude(location: Optional[str]) -> float:
    if not location:
        return GLOBAL_DEFAULT_LON

    key = location.lower().replace("_", " ").strip()

    if key in LOCATION_LON_TABLE:
        return LOCATION_LON_TABLE[key]

    for city, lon in LOCATION_LON_TABLE.items():
        if city in key:
            return lon

    for region, lon in REGION_LON_FALLBACK.items():
        if region in key:
            return lon

    return GLOBAL_DEFAULT_LON

# =====================================================
# True Solar Time
# =====================================================
def _equation_of_time_minutes(dt: datetime) -> float:
    """
    Equation of time (in minutes), i.e. how far apparent (sundial) solar
    time runs ahead of or behind mean solar time on a given date, caused
    by Earth's axial tilt and orbital eccentricity.

    Uses Meeus' low-precision solar position formulas (Astronomical
    Algorithms, ch. 28) driven off Julian centuries since J2000.0, which
    is accurate to roughly +/-0.1 minute across the whole 20th-21st
    century range. The previous implementation used a fixed 3-term
    trigonometric fit keyed only to day-of-year, which tracks the same
    overall shape but drifts by up to ~1 minute at points in the year
    (e.g. late Dec) -- rarely decisive on its own, but stacked with
    other small timing edges (rounding, DST/tz boundaries) it's the kind
    of gap worth closing near an hour-pillar boundary.

    dt must be timezone-aware. Only the calendar date matters in
    practice (the equation of time changes by well under a minute across
    a single day), but we still resolve to UTC for a well-defined Julian
    Day.
    """
    dt_utc = dt.astimezone(timezone.utc)

    y, m = dt_utc.year, dt_utc.month
    day_frac = dt_utc.day + (dt_utc.hour + dt_utc.minute / 60 + dt_utc.second / 3600) / 24
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    jd = math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + day_frac + b - 1524.5

    T = (jd - 2451545.0) / 36525.0

    l0 = math.radians((280.46646 + 36000.76983 * T + 0.0003032 * T ** 2) % 360)
    M = math.radians((357.52911 + 35999.05029 * T - 0.0001537 * T ** 2) % 360)
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T ** 2
    epsilon = math.radians(23.439291 - 0.0130042 * T - 0.00000016 * T ** 2)
    y_ = math.tan(epsilon / 2) ** 2

    E = (
        y_ * math.sin(2 * l0)
        - 2 * e * math.sin(M)
        + 4 * e * y_ * math.sin(M) * math.cos(2 * l0)
        - 0.5 * y_ ** 2 * math.sin(4 * l0)
        - 1.25 * e ** 2 * math.sin(2 * M)
    )

    return math.degrees(E) * 4  # radians -> degrees -> minutes (1 deg of Earth's rotation = 4 min)

def calculate_true_solar_time(local_dt: datetime, longitude: float) -> datetime:
    if local_dt.tzinfo is None:
        raise ValueError("Datetime must be timezone-aware")

    lon_offset = (longitude - 120.0) * 4.0
    eot = _equation_of_time_minutes(local_dt)

    return local_dt + timedelta(minutes=(lon_offset + eot))

def get_hour_zhi(hour: int) -> str:
    return ZHI[((hour + 1) // 2) % 12]

# =====================================================
# Core Engine (Full 4 Pillars - When Time is Known)
# =====================================================
def calc_bazi_fixed(dt: datetime, tz_name: str, longitude: float, zi_hour_convention: str = "advance"):
    """
    Calculate complete BaZi with all 4 pillars (requires accurate birth time)

    zi_hour_convention controls how the 23:00-01:00 子時 (Zi hour) is
    handled, which is a genuine, unsettled disagreement between BaZi
    schools -- not a bug either way:

    - "advance" (default, matches prior behavior): the whole 23:00-01:00
      window belongs to the *next* day -- both the day pillar and the
      hour-stem lookup use the next day. Sometimes called
      "早晚子時不分" / "一律進位".
    - "split": only 00:00-01:00 belongs to the next day. A birth in
      23:00-23:59 ("夜子時"/"早子時") keeps the *current* day's day
      pillar, and the hour stem is derived via the Five Rats (五鼠遁)
      formula from that same current-day stem. Sometimes called
      "早晚子時區分".

    The two conventions can only disagree for births in the 23:00-23:59
    true-solar-time window -- everyone agrees 00:00-01:00 is the next
    day, and that already falls out naturally below since true_solar's
    own date has already rolled over by then.
    """

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo(tz_name))
    else:
        dt = dt.astimezone(ZoneInfo(tz_name))

    true_solar = calculate_true_solar_time(dt, longitude)

    solar_date = true_solar.date()
    if true_solar.hour >= 23 and zi_hour_convention != "split":
        solar_date += timedelta(days=1)

    lunar = sxtwl.fromSolar(solar_date.year, solar_date.month, solar_date.day)

    year_gz = lunar.getYearGZ()
    month_gz = lunar.getMonthGZ()
    day_gz = lunar.getDayGZ()

    year_gan, year_zhi = GAN[year_gz.tg], ZHI[year_gz.dz]
    month_gan, month_zhi = GAN[month_gz.tg], ZHI[month_gz.dz]
    day_gan, day_zhi = GAN[day_gz.tg], ZHI[day_gz.dz]

    hour_zhi = get_hour_zhi(true_solar.hour)
    hour_zhi_idx = ZHI.index(hour_zhi)

    wushu = {
        "Jia": "Jia", "Ji": "Jia",
        "Yi": "Bing", "Geng": "Bing",
        "Bing": "Wu", "Xin": "Wu",
        "Ding": "Geng", "Ren": "Geng",
        "Wu": "Ren", "Gui": "Ren",
    }

    base_gan = wushu[day_gan]
    hour_gan = GAN[(GAN.index(base_gan) + hour_zhi_idx) % 10]

    pillars = {
        "year": {"gan": year_gan, "zhi": year_zhi},
        "month": {"gan": month_gan, "zhi": month_zhi},
        "day": {"gan": day_gan, "zhi": day_zhi},
        "hour": {"gan": hour_gan, "zhi": hour_zhi},
    }

    day_master = pillars["day"]["gan"]

    ELEMENT_MAP = {
        "Jia":"Wood", "Yi":"Wood",
        "Bing":"Fire","Ding":"Fire",
        "Wu":"Earth","Ji":"Earth",
        "Geng":"Metal","Xin":"Metal",
        "Ren":"Water","Gui":"Water",
        "Zi":"Water","Chou":"Earth","Yin":"Wood","Mao":"Wood",
        "Chen":"Earth","Si":"Fire","Wu":"Fire","Wei":"Earth",
        "Shen":"Metal","You":"Metal","Xu":"Earth","Hai":"Water"
    }

    ZHI_HIDDEN_STEMS = {
        "Zi":  [("Ren", 1.0)],
        "Chou":[("Ji", 0.6), ("Gui", 0.3), ("Xin", 0.1)],
        "Yin": [("Jia", 0.6), ("Bing", 0.3), ("Wu", 0.1)],
        "Mao": [("Yi", 1.0)],
        "Chen":[("Wu", 0.6), ("Yi", 0.3), ("Gui", 0.1)],
        "Si":  [("Bing", 0.6), ("Wu", 0.3), ("Geng", 0.1)],
        "Wu":  [("Ding", 0.6), ("Ji", 0.4)],
        "Wei": [("Ji", 0.6), ("Yi", 0.3), ("Ding", 0.1)],
        "Shen":[("Geng", 0.6), ("Ren", 0.3), ("Wu", 0.1)],
        "You": [("Xin", 1.0)],
        "Xu":  [("Wu", 0.6), ("Xin", 0.3), ("Ding", 0.1)],
        "Hai": [("Ren", 0.6), ("Jia", 0.4)],
    }
    
    fe_strength = {"Wood":0.0,"Fire":0.0,"Earth":0.0,"Metal":0.0,"Water":0.0}

    for p in pillars.values():
        gan = p["gan"]
        e = ELEMENT_MAP[gan]
        fe_strength[e] += 1.0

    for p in pillars.values():
        zhi = p["zhi"]
        for hidden_gan, weight in ZHI_HIDDEN_STEMS[zhi]:
            e = ELEMENT_MAP[hidden_gan]
            fe_strength[e] += weight

    return {
        "pillars": pillars,
        "day_master": day_master,
        "five_elements_strength": {k: round(v, 2) for k, v in fe_strength.items()},
        "pillars_count": 4,
    }

# =====================================================
# Core Engine (3 Pillars Only - When Time is Unknown)
# =====================================================
def calc_bazi_three_pillars(
    birth_date: datetime,
    tz_name: str = "Hong_Kong",
    location: Optional[str] = None
) -> Dict:
    """
    Calculate BaZi using only year, month, and day pillars.
    Uses 12:00 noon to ensure consistent day pillar calculation.
    """
    
    # Resolve location parameters
    longitude = resolve_longitude(location or tz_name)
    tz_resolved = tz_name if "/" in tz_name else "Asia/Hong_Kong"
    
    # CRITICAL: Use 12:00 noon to avoid day boundary crossing
    # This ensures the day pillar is ALWAYS correct for the given date
    dt = datetime(
        birth_date.year, 
        birth_date.month, 
        birth_date.day, 
        12,  # Noon - safe from Zi hour boundary (23:00-01:00)
        0,
        0
    )
    
    # Handle timezone (important for date correctness)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo(tz_resolved))
    else:
        dt = dt.astimezone(ZoneInfo(tz_resolved))
    
    # Get the date for lunar conversion
    # Using noon ensures we never cross the day boundary
    solar_date = dt.date()
    
    # Get lunar calendar data
    lunar = sxtwl.fromSolar(solar_date.year, solar_date.month, solar_date.day)
    
    # Get year, month, day pillars
    year_gz = lunar.getYearGZ()
    month_gz = lunar.getMonthGZ()
    day_gz = lunar.getDayGZ()
    
    # Extract stems and branches
    year_gan, year_zhi = GAN[year_gz.tg], ZHI[year_gz.dz]
    month_gan, month_zhi = GAN[month_gz.tg], ZHI[month_gz.dz]
    day_gan, day_zhi = GAN[day_gz.tg], ZHI[day_gz.dz]
    
    # Element mapping
    ELEMENT_MAP = {
        "Jia":"Wood", "Yi":"Wood",
        "Bing":"Fire","Ding":"Fire",
        "Wu":"Earth","Ji":"Earth",
        "Geng":"Metal","Xin":"Metal",
        "Ren":"Water","Gui":"Water",
        "Zi":"Water","Chou":"Earth","Yin":"Wood","Mao":"Wood",
        "Chen":"Earth","Si":"Fire","Wu":"Fire","Wei":"Earth",
        "Shen":"Metal","You":"Metal","Xu":"Earth","Hai":"Water"
    }
    
    ZHI_HIDDEN_STEMS = {
        "Zi":  [("Ren", 1.0)],
        "Chou":[("Ji", 0.6), ("Gui", 0.3), ("Xin", 0.1)],
        "Yin": [("Jia", 0.6), ("Bing", 0.3), ("Wu", 0.1)],
        "Mao": [("Yi", 1.0)],
        "Chen":[("Wu", 0.6), ("Yi", 0.3), ("Gui", 0.1)],
        "Si":  [("Bing", 0.6), ("Wu", 0.3), ("Geng", 0.1)],
        "Wu":  [("Ding", 0.6), ("Ji", 0.4)],
        "Wei": [("Ji", 0.6), ("Yi", 0.3), ("Ding", 0.1)],
        "Shen":[("Geng", 0.6), ("Ren", 0.3), ("Wu", 0.1)],
        "You": [("Xin", 1.0)],
        "Xu":  [("Wu", 0.6), ("Xin", 0.3), ("Ding", 0.1)],
        "Hai": [("Ren", 0.6), ("Jia", 0.4)],
    }
    
    # Calculate element strength from year, month, day only
    fe_strength = {"Wood":0.0,"Fire":0.0,"Earth":0.0,"Metal":0.0,"Water":0.0}
    
    pillars_three = [
        {"gan": year_gan, "zhi": year_zhi},
        {"gan": month_gan, "zhi": month_zhi},
        {"gan": day_gan, "zhi": day_zhi}
    ]
    
    for pillar in pillars_three:
        # Count heavenly stem
        gan_e = ELEMENT_MAP[pillar["gan"]]
        fe_strength[gan_e] += 1.0
        
        # Count hidden stems
        for hidden_gan, weight in ZHI_HIDDEN_STEMS[pillar["zhi"]]:
            hidden_e = ELEMENT_MAP[hidden_gan]
            fe_strength[hidden_e] += weight
    
    # Return structure with clear indication that hour is omitted
    return {
        "pillars": {
            "year": {"gan": year_gan, "zhi": year_zhi},
            "month": {"gan": month_gan, "zhi": month_zhi},
            "day": {"gan": day_gan, "zhi": day_zhi},
        },
        "day_master": day_gan,
        "five_elements_strength": {k: round(v, 2) for k, v in fe_strength.items()},
        "pillars_count": 3,
        "calculation_method": "three_pillars_only",
        "disclaimer": "时柱未推算 - 出生时间不详。分析基于年、月、日三柱。",
        "disclaimer_en": "Hour pillar not calculated - birth time unknown. Analysis based on year, month, and day pillars only.",
        "calculation_note": "Used 12:00 noon for consistent day pillar calculation"
    }

# =====================================================
# Analysis Functions
# =====================================================

def analyze_three_pillars(bazi_data: Dict, lang: str = "cn") -> Dict:
    """
    Provide comprehensive analysis for 3-pillar charts
    """
    
    pillars = bazi_data["pillars"]
    day_master = bazi_data["day_master"]
    elements = bazi_data["five_elements_strength"]
    
    # Determine element balance (without hour influence)
    strongest = max(elements, key=elements.get)
    weakest = min(elements, key=elements.get)
    
    # Core personality based on day master
    personality = {
        "Jia": {
            "cn": "甲木 - 参天大树，正直仁爱，有领导才能，独立自主",
            "en": "Jia Wood - Towering tree, upright and benevolent, natural leader, independent"
        },
        "Yi": {
            "cn": "乙木 - 花草藤蔓，柔韧灵活，有艺术气质，善于适应",
            "en": "Yi Wood - Flower and vine, flexible and adaptable, artistic nature, versatile"
        },
        "Bing": {
            "cn": "丙火 - 太阳之火，热情开朗，光芒四射，乐于奉献",
            "en": "Bing Fire - Sun fire, passionate and outgoing, radiant, generous"
        },
        "Ding": {
            "cn": "丁火 - 星烛之火，温和细腻，思维敏锐，内敛含蓄",
            "en": "Ding Fire - Star fire, gentle and refined, sharp mind, reserved"
        },
        "Wu": {
            "cn": "戊土 - 城墙之土，稳重守信，包容力强，踏实可靠",
            "en": "Wu Earth - City wall, stable and trustworthy, tolerant, reliable"
        },
        "Ji": {
            "cn": "己土 - 田园之土，谦逊包容，善于协调，耐心细致",
            "en": "Ji Earth - Field soil, humble and accommodating, coordinating, patient"
        },
        "Geng": {
            "cn": "庚金 - 刀剑之金，刚毅果断，重义气，有魄力",
            "en": "Geng Metal - Sword metal, resolute and decisive, loyal, courageous"
        },
        "Xin": {
            "cn": "辛金 - 珠宝之金，精致细腻，追求完美，善于思考",
            "en": "Xin Metal - Jewelry metal, refined and meticulous, perfectionist, thoughtful"
        },
        "Ren": {
            "cn": "壬水 - 江河之水，智慧通达，心胸开阔，适应力强",
            "en": "Ren Water - River water, wise and insightful, broad-minded, adaptable"
        },
        "Gui": {
            "cn": "癸水 - 雨露之水，细腻敏感，直觉敏锐，善于谋略",
            "en": "Gui Water - Rain water, subtle and sensitive, intuitive, strategic"
        }
    }
    
    # Career suggestions based on strongest element
    career_hints = {
        "Wood": {
            "cn": "教育、文化、艺术、医疗、环保、园林设计",
            "en": "Education, culture, arts, healthcare, environmental protection, landscape design"
        },
        "Fire": {
            "cn": "传媒、娱乐、科技、能源、市场营销、心理咨询",
            "en": "Media, entertainment, technology, energy, marketing, counseling"
        },
        "Earth": {
            "cn": "房地产、建筑、管理、金融、咨询、教育",
            "en": "Real estate, construction, management, finance, consulting, education"
        },
        "Metal": {
            "cn": "法律、金融、工程、制造、军事、精密技术",
            "en": "Law, finance, engineering, manufacturing, military, precision technology"
        },
        "Water": {
            "cn": "贸易、物流、旅游、传媒、咨询、研究",
            "en": "Trade, logistics, travel, media, consulting, research"
        }
    }
    
    # Relationship insights
    day_zhi = pillars["day"]["zhi"]
    relationship_notes = {
        "Zi": {"cn": "子水 - 聪明灵动，配偶多有智慧", "en": "Zi Water - Intelligent, spouse is often wise"},
        "Chou": {"cn": "丑土 - 稳重踏实，配偶多可靠务实", "en": "Chou Earth - Stable, spouse is reliable"},
        "Yin": {"cn": "寅木 - 积极进取，配偶多有抱负", "en": "Yin Wood - Ambitious, spouse is driven"},
        "Mao": {"cn": "卯木 - 温和善良，配偶多温柔体贴", "en": "Mao Wood - Gentle, spouse is caring"},
        "Chen": {"cn": "辰土 - 包容大度，配偶多有智慧", "en": "Chen Earth - Tolerant, spouse is wise"},
        "Si": {"cn": "巳火 - 热情开朗，配偶多外向活跃", "en": "Si Fire - Passionate, spouse is outgoing"},
        "Wu": {"cn": "午火 - 真诚直率，配偶多热情大方", "en": "Wu Fire - Sincere, spouse is generous"},
        "Wei": {"cn": "未土 - 体贴周到，配偶多温柔细腻", "en": "Wei Earth - Considerate, spouse is gentle"},
        "Shen": {"cn": "申金 - 聪明睿智，配偶多能力出众", "en": "Shen Metal - Intelligent, spouse is capable"},
        "You": {"cn": "酉金 - 细致严谨，配偶多追求完美", "en": "You Metal - Meticulous, spouse is perfectionist"},
        "Xu": {"cn": "戌土 - 忠诚可靠，配偶多责任感强", "en": "Xu Earth - Loyal, spouse is responsible"},
        "Hai": {"cn": "亥水 - 随和包容，配偶多善解人意", "en": "Hai Water - Easygoing, spouse is understanding"}
    }
    
    return {
        "personality": personality.get(day_master, personality["Wu"])[lang],
        "element_balance": {
            "strongest": strongest,
            "weakest": weakest,
            "strengths": {k: v for k, v in elements.items() if v > 1.0},
            "needs_support": {k: v for k, v in elements.items() if v < 0.5}
        },
        "career_direction": career_hints.get(strongest, career_hints["Earth"])[lang],
        "relationship": relationship_notes.get(day_zhi, {"cn": "随缘而安", "en": "Go with the flow"})[lang],
        "element_scores": elements,
        "limitations": {
            "missing": {
                "cn": "时柱 (子女运、晚年运、事业高峰细节)",
                "en": "Hour pillar (children, later life, career culmination details)"
            },
            "can_still_analyze": {
                "cn": [
                    "核心性格与人格特质",
                    "事业发展方向与天赋",
                    "感情与婚姻模式",
                    "五行强弱与喜忌",
                    "人生大运走势"
                ],
                "en": [
                    "Core personality and character",
                    "Career direction and aptitudes",
                    "Relationship patterns",
                    "Elemental strengths and weaknesses",
                    "Life fortune cycles"
                ]
            }
        }
    }

# =====================================================
# Display Functions
# =====================================================

def display_three_pillar_bazi(bazi_data: Dict, lang: str = "cn"):
    """
    Display BaZi with only 3 pillars - professional format
    """
    
    gan_map = GAN_CN if lang == "cn" else GAN
    zhi_map = ZHI_CN if lang == "cn" else ZHI
    
    # Get analysis
    analysis = analyze_three_pillars(bazi_data, lang)
    
    print("=" * 70)
    print("八字四柱推算 / Four Pillars Calculation")
    print("=" * 70)
    print()
    
    # Display pillars
    print("年柱 / Year Pillar:", end=" ")
    year_pillar = bazi_data["pillars"]["year"]
    year_label = f"{gan_map[GAN.index(year_pillar['gan'])]}{zhi_map[ZHI.index(year_pillar['zhi'])]}"
    print(f"{year_label}")
    if lang == "cn":
        print("   └─ 祖上、早年运势、家庭背景")
    else:
        print("   └─ Ancestors, early life, family background")
    print()
    
    print("月柱 / Month Pillar:", end=" ")
    month_pillar = bazi_data["pillars"]["month"]
    month_label = f"{gan_map[GAN.index(month_pillar['gan'])]}{zhi_map[ZHI.index(month_pillar['zhi'])]}"
    print(f"{month_label}")
    if lang == "cn":
        print("   └─ 父母、事业、青年运势")
    else:
        print("   └─ Parents, career, youth")
    print()
    
    print("日柱 / Day Pillar:", end=" ")
    day_pillar = bazi_data["pillars"]["day"]
    day_label = f"{gan_map[GAN.index(day_pillar['gan'])]}{zhi_map[ZHI.index(day_pillar['zhi'])]}"
    day_master_cn = gan_map[GAN.index(bazi_data["day_master"])]
    print(f"{day_label} (日主 / Day Master: {day_master_cn})")
    if lang == "cn":
        print("   └─ 自身、配偶、中年运势")
    else:
        print("   └─ Self, spouse, adulthood")
    print()
    
    print("时柱 / Hour Pillar:", end=" ")
    if lang == "cn":
        print("【未推算 - 出生时间不详】")
        print("   └─ 未计算时柱，因缺乏准确出生时间")
    else:
        print("[Not Calculated - Birth Time Unknown]")
        print("   └─ Hour pillar omitted due to unknown birth time")
    print()
    
    print("-" * 70)
    print(f"📝 {bazi_data['disclaimer']}")
    print()
    
    # Element analysis
    print("五行力量 / Five Elements Strength:")
    elements = bazi_data["five_elements_strength"]
    for element, value in sorted(elements.items(), key=lambda x: x[1], reverse=True):
        element_cn = {"Wood": "木", "Fire": "火", "Earth": "土", "Metal": "金", "Water": "水"}[element]
        bar = "█" * int(value * 2)
        print(f"  {element:6s} ({element_cn}): {value:4.1f} {bar}")
    print()
    
    # Analysis results
    print("=" * 70)
    print("📊 命理分析 / Analysis")
    print("=" * 70)
    print()
    print(f"✨ 核心性格 / Core Personality:")
    print(f"   {analysis['personality']}")
    print()
    
    print(f"💼 事业方向 / Career Direction:")
    print(f"   {analysis['career_direction']}")
    print()
    
    print(f"❤️ 感情特质 / Relationship Insights:")
    print(f"   {analysis['relationship']}")
    print()
    
    print(f"⚖️ 五行平衡 / Element Balance:")
    print(f"   最强 / Strongest: {analysis['element_balance']['strongest']}")
    print(f"   最弱 / Weakest: {analysis['element_balance']['weakest']}")
    if analysis['element_balance']['strengths']:
        print(f"   优势元素 / Strengths: {', '.join(analysis['element_balance']['strengths'].keys())}")
    if analysis['element_balance']['needs_support']:
        print(f"   需补元素 / Needs Support: {', '.join(analysis['element_balance']['needs_support'].keys())}")
    print()
    
    print("-" * 70)
    print("⚠️ 重要说明 / Important Notes:")
    print(f"   {bazi_data['disclaimer']}")
    print()
    
    if lang == "cn":
        print("   由于时柱未知，以下方面需谨慎判断:")
        for item in analysis['limitations']['can_still_analyze']['cn']:
            print(f"     • {item}")
        print()
        print("💡 建议: 如能获得准确出生时间，可进行完整的四柱推算")
    else:
        print("   Due to unknown hour pillar, the following aspects require caution:")
        for item in analysis['limitations']['can_still_analyze']['en']:
            print(f"     • {item}")
        print()
        print("💡 Recommendation: If you can obtain the exact birth time, a complete 4-pillar calculation is recommended")
    
    print()
    print("=" * 70)

# =====================================================
# Main Public Function (Auto-detect based on input)
# =====================================================

def calculate_bazi(
    birth_date: datetime,
    tz_name: str = "Hong_Kong",
    location: Optional[str] = None,
    time_known: Optional[bool] = None,
    lng: Optional[float] = None,
    zi_hour_convention: Optional[str] = None,
) -> Dict:
    """
    Main BaZi calculation function - auto-detects whether to use 3 or 4 pillars

    Args:
        birth_date: Birth date and time (if known)
        tz_name: Timezone or location name
        location: Specific location for longitude
        time_known: Whether birth time is known (auto-detected if None)
        lng: Precise birth longitude in degrees, if known (e.g. from geocoded
            birthplace autocomplete). Takes priority over the location-name
            lookup table, which only covers a small hardcoded set of cities
            and falls back to crude country-level centroids otherwise --
            e.g. all of "china" resolves to 120.0E regardless of whether the
            birth city is Shanghai or Urumqi, a ~60 degree spread. Precise
            coordinates avoid that error in the true solar time correction.
        zi_hour_convention: "advance" (default) or "split" -- see
            calc_bazi_fixed() for what these mean. Only matters for births
            in the 23:00-23:59 true-solar-time window.

    Returns:
        BaZi data with either 3 or 4 pillars
    """

    # Auto-detect if time is known
    if time_known is None:
        # If hour is 0 and minute is 0, likely placeholder (unknown)
        if birth_date.hour == 0 and birth_date.minute == 0:
            time_known = False
        else:
            time_known = True

    if time_known:
        # Use full 4-pillar calculation
        longitude = lng if lng is not None else resolve_longitude(location or tz_name)
        tz_resolved = tz_name if "/" in tz_name else "Asia/Hong_Kong"
        return calc_bazi_fixed(birth_date, tz_resolved, longitude, zi_hour_convention or "advance")
    else:
        # Use 3-pillar calculation (professional approach for unknown time)
        return calc_bazi_three_pillars(birth_date, tz_name, location)

# =====================================================
# Localization Helpers
# =====================================================

def enrich_with_localized_pillars(bazi_data: Dict, lang: str = "cn"):
    """Add localized labels to pillars"""
    gan_map = GAN_CN if lang == "cn" else GAN
    zhi_map = ZHI_CN if lang == "cn" else ZHI
    
    if "pillars" in bazi_data:
        for key, pillar in bazi_data["pillars"].items():
            if "gan" in pillar and "zhi" in pillar:
                try:
                    gan_idx = GAN.index(pillar["gan"])
                    zhi_idx = ZHI.index(pillar["zhi"])
                    pillar["label"] = gan_map[gan_idx] + zhi_map[zhi_idx]
                    pillar["gan_local"] = gan_map[gan_idx]
                    pillar["zhi_local"] = zhi_map[zhi_idx]
                except (ValueError, IndexError):
                    pillar["label"] = "???"
                    pillar["gan_local"] = "?"
                    pillar["zhi_local"] = "?"

def localize_pillars(pillars: Dict, lang: str = "en") -> Tuple[Dict, str]:
    """Localize pillars to specified language"""
    lang = lang.lower()
    gan_map = GAN_MAP.get(lang, GAN_MAP["en"])
    zhi_map = ZHI_MAP.get(lang, ZHI_MAP["en"])
    
    def map_one(gz):
        try:
            gan_en = gz["gan"]
            zhi_en = gz["zhi"]
            gan_local = gan_map[GAN_MAP["en"].index(gan_en)]
            zhi_local = zhi_map[ZHI_MAP["en"].index(zhi_en)]
            return {**gz, "gan_local": gan_local, "zhi_local": zhi_local}
        except (ValueError, KeyError):
            return {**gz, "gan_local": "?", "zhi_local": "?"}
    
    localized = {k: map_one(v) for k, v in pillars.items()}
    full_str = " ".join([
        v["gan_local"] + v["zhi_local"] 
        for v in localized.values() 
        if v["gan_local"] != "?"
    ])
    
    return localized, full_str

# =====================================================
# Test Cases
# =====================================================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("VERIFICATION: Day Pillar, Day Master & Five Elements Test")
    print("=" * 70)
    
    # Test date: 1966-10-09 (your test case)
    test_date = datetime(1966, 10, 9, 0, 0)  # midnight placeholder
    
    # Method 1: Known time at 07:00 (7am)
    result_known = calculate_bazi(
        birth_date=datetime(1966, 10, 9, 7, 0),
        tz_name="Hong_Kong",
        time_known=True
    )
    
    # Method 2: Unknown time (3 pillars only)
    result_unknown = calculate_bazi(
        birth_date=test_date,
        tz_name="Hong_Kong",
        time_known=False
    )
    
    # Add localized labels
    enrich_with_localized_pillars(result_known, lang="cn")
    enrich_with_localized_pillars(result_unknown, lang="cn")
    
    # Day Master Display
    print("\n" + "=" * 70)
    print("👤 DAY MASTER (日主) - Core of the Chart")
    print("=" * 70)
    
    day_master_cn_map = {
        "Jia": "甲木", "Yi": "乙木",
        "Bing": "丙火", "Ding": "丁火",
        "Wu": "戊土", "Ji": "己土",
        "Geng": "庚金", "Xin": "辛金",
        "Ren": "壬水", "Gui": "癸水"
    }
    
    day_master_element = {
        "Jia": "Wood", "Yi": "Wood",
        "Bing": "Fire", "Ding": "Fire",
        "Wu": "Earth", "Ji": "Earth",
        "Geng": "Metal", "Xin": "Metal",
        "Ren": "Water", "Gui": "Water"
    }
    
    print(f"\n🔮 KNOWN TIME (4 Pillars):")
    print(f"   Day Master: {result_known['day_master']} ({day_master_cn_map[result_known['day_master']]})")
    print(f"   Element: {day_master_element[result_known['day_master']]}")
    print(f"   Day Pillar: {result_known['pillars']['day']['label']}")
    
    print(f"\n❓ UNKNOWN TIME (3 Pillars):")
    print(f"   Day Master: {result_unknown['day_master']} ({day_master_cn_map[result_unknown['day_master']]})")
    print(f"   Element: {day_master_element[result_unknown['day_master']]}")
    print(f"   Day Pillar: {result_unknown['pillars']['day']['label']}")
    
    print(f"\n✅ Day Master Consistency: {result_known['day_master'] == result_unknown['day_master']}")
    
    # Day Pillar Comparison
    print("\n" + "=" * 70)
    print("📅 DAY PILLAR COMPARISON")
    print("=" * 70)
    
    print(f"\n   Known Time (07:00)  - Day Pillar: {result_known['pillars']['day']['label']}")
    print(f"   Unknown Time        - Day Pillar: {result_unknown['pillars']['day']['label']}")
    print(f"   ✅ Day pillars match: {result_known['pillars']['day']['label'] == result_unknown['pillars']['day']['label']}")
    
    # Full Pillar Comparison
    print("\n" + "=" * 70)
    print("📋 FULL PILLARS COMPARISON")
    print("=" * 70)
    
    print("\n🔮 KNOWN TIME (4 Pillars - Full Chart):")
    print(f"   年柱: {result_known['pillars']['year']['label']} ({result_known['pillars']['year']['gan']}{result_known['pillars']['year']['zhi']})")
    print(f"   月柱: {result_known['pillars']['month']['label']} ({result_known['pillars']['month']['gan']}{result_known['pillars']['month']['zhi']})")
    print(f"   日柱: {result_known['pillars']['day']['label']} ({result_known['pillars']['day']['gan']}{result_known['pillars']['day']['zhi']})")
    print(f"   时柱: {result_known['pillars']['hour']['label']} ({result_known['pillars']['hour']['gan']}{result_known['pillars']['hour']['zhi']})")
    print(f"   日主: {result_known['day_master']} ({day_master_cn_map[result_known['day_master']]})")
    
    print("\n❓ UNKNOWN TIME (3 Pillars - Hour Not Calculated):")
    print(f"   年柱: {result_unknown['pillars']['year']['label']} ({result_unknown['pillars']['year']['gan']}{result_unknown['pillars']['year']['zhi']})")
    print(f"   月柱: {result_unknown['pillars']['month']['label']} ({result_unknown['pillars']['month']['gan']}{result_unknown['pillars']['month']['zhi']})")
    print(f"   日柱: {result_unknown['pillars']['day']['label']} ({result_unknown['pillars']['day']['gan']}{result_unknown['pillars']['day']['zhi']})")
    print(f"   时柱: [未推算 - 出生时间不详]")
    print(f"   日主: {result_unknown['day_master']} ({day_master_cn_map[result_unknown['day_master']]})")
    
    # Five Elements Comparison
    print("\n" + "=" * 70)
    print("⚖️ FIVE ELEMENTS COMPARISON (五行力量)")
    print("=" * 70)
    
    elements_known = result_known['five_elements_strength']
    elements_unknown = result_unknown['five_elements_strength']
    
    # Element mapping for Chinese display
    element_cn = {
        "Wood": "木", 
        "Fire": "火", 
        "Earth": "土", 
        "Metal": "金", 
        "Water": "水"
    }
    
    print("\n📊 KNOWN TIME (4 Pillars - Includes Hour Pillar):")
    print("   ┌─────────┬──────────┬─────────────┬──────────────────┐")
    print("   │ Element │ Strength │ Bar         │ vs Day Master    │")
    print("   ├─────────┼──────────┼─────────────┼──────────────────┤")
    
    day_master_elem = day_master_element[result_known['day_master']]
    for element in ["Wood", "Fire", "Earth", "Metal", "Water"]:
        strength = elements_known[element]
        bar = "█" * int(strength * 2)
        relationship = "⭐ 日主" if element == day_master_elem else ""
        print(f"   │ {element_cn[element]:3s}    │ {strength:5.1f}    │ {bar:<11} │ {relationship:16} │")
    print("   └─────────┴──────────┴─────────────┴──────────────────┘")
    
    print("\n📊 UNKNOWN TIME (3 Pillars - No Hour Pillar):")
    print("   ┌─────────┬──────────┬─────────────┬──────────────────┐")
    print("   │ Element │ Strength │ Bar         │ vs Day Master    │")
    print("   ├─────────┼──────────┼─────────────┼──────────────────┤")
    
    for element in ["Wood", "Fire", "Earth", "Metal", "Water"]:
        strength = elements_unknown[element]
        bar = "█" * int(strength * 2)
        relationship = "⭐ 日主" if element == day_master_elem else ""
        print(f"   │ {element_cn[element]:3s}    │ {strength:5.1f}    │ {bar:<11} │ {relationship:16} │")
    print("   └─────────┴──────────┴─────────────┴──────────────────┘")
    
    # Difference Analysis
    print("\n📈 DIFFERENCE ANALYSIS (Unknown vs Known):")
    print("   ┌─────────┬──────────┬──────────┬─────────────┬─────────────────┐")
    print("   │ Element │ Known    │ Unknown  │ Difference  │ Impact          │")
    print("   ├─────────┼──────────┼──────────┼─────────────┼─────────────────┤")
    for element in ["Wood", "Fire", "Earth", "Metal", "Water"]:
        known = elements_known[element]
        unknown = elements_unknown[element]
        diff = unknown - known
        diff_symbol = "↑" if diff > 0 else "↓" if diff < 0 else "="
        
        # Explain impact
        if element == day_master_elem:
            impact = "日主力量变化"
        elif diff > 0:
            impact = f"{element_cn[element]}增强"
        elif diff < 0:
            impact = f"{element_cn[element]}减弱"
        else:
            impact = "无变化"
        
        print(f"   │ {element_cn[element]:3s}    │ {known:5.1f}    │ {unknown:5.1f}    │ {diff:5.1f} {diff_symbol}    │ {impact:15} │")
    print("   └─────────┴──────────┴──────────┴─────────────┴─────────────────┘")
    
    # Hour Pillar Contribution
    print("\n💡 HOUR PILLAR CONTRIBUTION (Why elements differ):")
    print("   " + "-" * 66)
    
    if "hour" in result_known['pillars']:
        hour_gan = result_known['pillars']['hour']['gan']
        hour_zhi = result_known['pillars']['hour']['zhi']
        
        print(f"\n   Hour pillar in known time: {hour_gan}{hour_zhi}")
        print(f"   This contributes to the 4-pillar chart but is ABSENT in 3-pillar chart:\n")
        
        ELEMENT_MAP = {
            "Jia":"Wood", "Yi":"Wood",
            "Bing":"Fire","Ding":"Fire",
            "Wu":"Earth","Ji":"Earth",
            "Geng":"Metal","Xin":"Metal",
            "Ren":"Water","Gui":"Water",
        }
        
        ZHI_HIDDEN_STEMS = {
            "Zi":  [("Ren", 1.0)],
            "Chou":[("Ji", 0.6), ("Gui", 0.3), ("Xin", 0.1)],
            "Yin": [("Jia", 0.6), ("Bing", 0.3), ("Wu", 0.1)],
            "Mao": [("Yi", 1.0)],
            "Chen":[("Wu", 0.6), ("Yi", 0.3), ("Gui", 0.1)],
            "Si":  [("Bing", 0.6), ("Wu", 0.3), ("Geng", 0.1)],
            "Wu":  [("Ding", 0.6), ("Ji", 0.4)],
            "Wei": [("Ji", 0.6), ("Yi", 0.3), ("Ding", 0.1)],
            "Shen":[("Geng", 0.6), ("Ren", 0.3), ("Wu", 0.1)],
            "You": [("Xin", 1.0)],
            "Xu":  [("Wu", 0.6), ("Xin", 0.3), ("Ding", 0.1)],
            "Hai": [("Ren", 0.6), ("Jia", 0.4)],
        }
        
        # Hour stem contribution
        hour_stem_element = ELEMENT_MAP[hour_gan]
        print(f"   📍 Hour Stem ({hour_gan}): +1.0 {hour_stem_element}")
        
        # Hour branch hidden stems
        print(f"   📍 Hour Branch ({hour_zhi}) hidden stems:")
        for hidden_gan, weight in ZHI_HIDDEN_STEMS[hour_zhi]:
            hidden_element = ELEMENT_MAP[hidden_gan]
            print(f"      └─ {hidden_gan}: +{weight} {hidden_element}")
    
    print("\n" + "=" * 70)
    print("✅ TEST COMPLETE")
    print("=" * 70)
    
    print("\n📝 SUMMARY:")
    print(f"   ✓ Day Master: {result_known['day_master']} (SAME for both) - This is the CORE of the chart")
    print(f"   ✓ Day Pillar: {result_known['pillars']['day']['label']} (SAME for both)")
    print(f"   ✗ Five Elements: DIFFER because hour pillar is included/excluded")
    print(f"   ✓ This is EXPECTED behavior for unknown birth time")
    print(f"   ✓ LLM will receive DIFFERENT element strengths based on time confidence")
    print(f"\n   🎯 Day Master remains the anchor - all analysis centers on this!")
# =====================================================
# 大運 (Luck Cycles) Calculation
# =====================================================

JQ_NAMES_ZH = {
    1: '小寒', 2: '大寒', 3: '立春', 4: '雨水', 5: '驚蟄', 6: '春分',
    7: '清明', 8: '穀雨', 9: '立夏', 10: '小滿', 11: '芒種', 12: '夏至',
    13: '小暑', 14: '大暑', 15: '立秋', 16: '處暑', 17: '白露', 18: '秋分',
    19: '寒露', 20: '霜降', 21: '立冬', 22: '小雪', 23: '大雪', 24: '冬至'
}

def calculate_dayun(birth_year: int, birth_month: int, birth_day: int, is_male: bool) -> Optional[Dict]:
    """Calculate 大運 (10-year luck cycles) based on birth date and gender."""
    try:
        birth = sxtwl.fromSolar(birth_year, birth_month, birth_day)
        year_gz = birth.getYearGZ()
        month_gz = birth.getMonthGZ()

        yang_stems = [1, 3, 5, 7, 9]
        is_yang = year_gz.tg in yang_stems
        forward = (is_yang and is_male) or (not is_yang and not is_male)

        birth_datetime = datetime(birth_year, birth_month, birth_day)
        target_jd = None
        target_name = None

        for yr in range(birth_year - 1, birth_year + 3):
            jq_list = sxtwl.getJieQiByYear(yr)
            for jq in jq_list:
                jq_date = sxtwl.JD2DD(jq.jd)
                jq_datetime = datetime(jq_date.Y, jq_date.M, jq_date.D)
                if forward:
                    if jq_datetime > birth_datetime:
                        if target_jd is None or jq.jd < target_jd:
                            target_jd = jq.jd
                            target_name = JQ_NAMES_ZH.get(jq.jqIndex, str(jq.jqIndex))
                else:
                    if jq_datetime < birth_datetime:
                        if target_jd is None or jq.jd > target_jd:
                            target_jd = jq.jd
                            target_name = JQ_NAMES_ZH.get(jq.jqIndex, str(jq.jqIndex))

        if target_jd is None:
            return None

        target_date = sxtwl.JD2DD(target_jd)
        target_datetime = datetime(target_date.Y, target_date.M, target_date.D)
        days_diff = abs((target_datetime - birth_datetime).days)
        years_float = days_diff / 3.0
        years_int = int(years_float)
        months_int = int((years_float - years_int) * 12)

        month_stem_idx = month_gz.tg - 1
        month_branch_idx = month_gz.dz - 1

        current_year = datetime.now().year
        dayuns = []

        for i in range(8):
            age = years_float + (i * 10)
            calendar_year = birth_year + int(age)
            if forward:
                stem_idx = (month_stem_idx + i + 1) % 10
                branch_idx = (month_branch_idx + i + 1) % 12
            else:
                stem_idx = (month_stem_idx - i - 1) % 10
                branch_idx = (month_branch_idx - i - 1) % 12

            pillar = GAN_CN[stem_idx] + ZHI_CN[branch_idx]
            pillar_en = GAN[stem_idx] + ZHI[branch_idx]
            is_current = calendar_year <= current_year < calendar_year + 10

            dayuns.append({
                'pillar': pillar,
                'pillar_en': pillar_en,
                'stem': GAN_CN[stem_idx],
                'branch': ZHI_CN[branch_idx],
                'stem_en': GAN[stem_idx],
                'branch_en': ZHI[branch_idx],
                'start_age': round(age, 1),
                'end_age': round(age + 9, 1),
                'start_year': calendar_year,
                'end_year': calendar_year + 9,
                'is_current': is_current,
            })

        return {
            'direction': 'forward' if forward else 'backward',
            'years_to_first': round(years_float, 2),
            'years_int': years_int,
            'months_int': months_int,
            'target_solar_term': target_name,
            'dayuns': dayuns,
            'current_dayun': next((d for d in dayuns if d['is_current']), None),
        }
    except Exception as e:
        return None


# =====================================================
# ADVANCED CALCULATIONS
# 1. 十神 (Ten Gods)
# 2. 身强/身弱 (Day Master Strength)
# 3. 用神/忌神 (Favorable / Unfavorable Elements)
# 4. 空亡 (Void Branches)
# =====================================================

# ── 1. 十神 (Ten Gods) ────────────────────────────────────────────────

def get_ten_god(day_master: str, stem: str) -> str:
    """
    Return the 十神 of `stem` relative to `day_master`.

    Rules (element relationship × yin/yang polarity):
      Same element, same  polarity  → 比肩
      Same element, diff  polarity  → 劫財
      DM generates stem,  same pol  → 食神
      DM generates stem,  diff pol  → 傷官
      DM controls  stem,  diff pol  → 正財
      DM controls  stem,  same pol  → 偏財
      Stem controls  DM,  diff pol  → 正官
      Stem controls  DM,  same pol  → 七殺
      Stem generates DM,  diff pol  → 正印
      Stem generates DM,  same pol  → 偏印
    """
    dm_elem = GAN_ELEMENT[day_master]
    dm_pol  = GAN_POLARITY[day_master]
    x_elem  = GAN_ELEMENT[stem]
    x_pol   = GAN_POLARITY[stem]
    same    = (dm_pol == x_pol)

    if x_elem == dm_elem:
        return "比肩" if same else "劫財"
    if ELEM_GENERATES[dm_elem] == x_elem:   # DM → X
        return "食神" if same else "傷官"
    if ELEM_CONTROLS[dm_elem] == x_elem:    # DM controls X
        return "偏財" if same else "正財"
    if ELEM_GENERATES[x_elem] == dm_elem:   # X → DM
        return "偏印" if same else "正印"
    if ELEM_CONTROLS[x_elem] == dm_elem:    # X controls DM
        return "七殺" if same else "正官"
    raise ValueError(f"No ten-god relationship between {day_master} and {stem}")


def calculate_ten_gods(pillars: Dict) -> Dict:
    """
    Calculate 十神 for every stem in the chart (heavenly stems + branch hidden stems).

    Returns:
      by_position  – ten god for year/month/day/hour heavenly stems
                     (day stem always 日主, not calculated against itself)
      hidden       – ten gods for branch hidden stems at each position
      summary      – count of each ten-god type (heavenly stems only)
    """
    day_master = pillars["day"]["gan"]
    by_position: Dict = {}
    hidden: Dict = {}
    counts: Dict = {}

    position_labels = {
        "year": "年干", "month": "月干", "day": "日干", "hour": "時干"
    }

    for pos, pillar in pillars.items():
        stem = pillar["gan"]
        if pos == "day":
            tg = "日主"
        else:
            tg = get_ten_god(day_master, stem)
            counts[tg] = counts.get(tg, 0) + 1

        by_position[pos] = {
            "stem": stem,
            "ten_god": tg,
            "label": position_labels.get(pos, pos),
        }

        # Hidden stems in earthly branch
        zhi = pillar["zhi"]
        hidden[pos] = {
            "branch": zhi,
            "hidden_stems": [
                {"stem": hs, "ten_god": get_ten_god(day_master, hs), "weight": w}
                for hs, w in ZHI_HIDDEN[zhi]
            ],
        }

    return {"by_position": by_position, "hidden": hidden, "summary": counts}


# ── 2. 身强/身弱 (Day Master Strength) ───────────────────────────────

def classify_body_strength(pillars: Dict) -> Dict:
    """
    Classify day master strength via 得令 + 得地 + 得勢.

    得令 – seasonal support from month branch main qi:
        旺 (peak, score 3.0): month branch qi IS the DM element
        相 (secondary, 1.5): month branch qi GENERATES the DM element
        失令 (0.0): neither

    得地 – DM element rooted in branch hidden stems:
        Sum weighted contributions across all four branches.
        得地 = True when total root score ≥ 0.6

    得勢 – net support from year/month/hour heavenly stems:
        比劫 (same element)   +1.0
        印   (generates DM)   +0.8
        食傷 (DM generates)   −0.3
        財   (DM controls)    −0.2
        官殺 (controls DM)    −0.8
        得勢 = True when support_score > 0

    Classification table (8 boolean combinations → 5 levels):
      T T T → 極強    T T F → 身強    T F T → 身強
      F T T → 均衡    T F F → 均衡    F T F → 身弱
      F F T → 身弱    F F F → 極弱
    """
    day_master = pillars["day"]["gan"]
    dm_elem    = GAN_ELEMENT[day_master]

    # ── 得令 ──
    m_branch = pillars["month"]["zhi"]
    m_qi     = MONTH_BRANCH_QI[m_branch]

    if m_qi == dm_elem:
        de_ling, de_ling_type, de_ling_score = True,  "旺",  3.0
    elif ELEM_GENERATES[m_qi] == dm_elem:
        de_ling, de_ling_type, de_ling_score = True,  "相",  1.5
    else:
        de_ling, de_ling_type, de_ling_score = False, "失令", 0.0

    # ── 得地 ──
    root_score = 0.0
    root_by_pos: Dict = {}
    for pos, pillar in pillars.items():
        zhi = pillar["zhi"]
        pos_root = sum(
            w for hs, w in ZHI_HIDDEN[zhi] if GAN_ELEMENT[hs] == dm_elem
        )
        root_by_pos[pos] = round(pos_root, 2)
        root_score += pos_root

    de_di = root_score >= 0.6

    # ── 得勢 ──
    STEM_CONTRIBUTION = {
        "compare":   1.0,   # 比劫 — same element
        "resource":  0.8,   # 印   — generates DM
        "output":   -0.3,   # 食傷 — DM generates
        "wealth":   -0.2,   # 財   — DM controls
        "officer":  -0.8,   # 官殺 — controls DM
    }
    support_score = 0.0
    stem_detail: Dict = {}

    for pos in ("year", "month", "hour"):
        if pos not in pillars:
            continue
        stem   = pillars[pos]["gan"]
        s_elem = GAN_ELEMENT[stem]

        if s_elem == dm_elem:
            rel, contrib = "比劫", STEM_CONTRIBUTION["compare"]
        elif ELEM_GENERATES[s_elem] == dm_elem:
            rel, contrib = "印",   STEM_CONTRIBUTION["resource"]
        elif ELEM_GENERATES[dm_elem] == s_elem:
            rel, contrib = "食傷", STEM_CONTRIBUTION["output"]
        elif ELEM_CONTROLS[dm_elem] == s_elem:
            rel, contrib = "財",   STEM_CONTRIBUTION["wealth"]
        else:  # ELEM_CONTROLS[s_elem] == dm_elem
            rel, contrib = "官殺", STEM_CONTRIBUTION["officer"]

        support_score += contrib
        stem_detail[pos] = {"stem": stem, "relation": rel, "contribution": contrib}

    de_shi = support_score > 0

    # ── Classification ──
    table = {
        (True,  True,  True):  "極強",
        (True,  True,  False): "身強",
        (True,  False, True):  "身強",
        (False, True,  True):  "均衡",
        (True,  False, False): "均衡",
        (False, True,  False): "身弱",
        (False, False, True):  "身弱",
        (False, False, False): "極弱",
    }
    classification = table[(de_ling, de_di, de_shi)]

    return {
        "classification": classification,
        "de_ling": {
            "result": de_ling, "type": de_ling_type,
            "month_branch": m_branch, "month_qi": m_qi,
            "score": de_ling_score,
        },
        "de_di": {
            "result": de_di,
            "root_score": round(root_score, 2),
            "by_branch": root_by_pos,
        },
        "de_shi": {
            "result": de_shi,
            "support_score": round(support_score, 2),
            "by_stem": stem_detail,
        },
    }


# ── 3. 用神/忌神 (Favorable / Unfavorable Elements) ───────────────────

def calculate_yong_ji_shen(dm_element: str, body_strength: str,
                           five_elements_strength: Dict) -> Dict:
    """
    Determine 用神 (yòng shén, favorable) and 忌神 (jì shén, unfavorable) elements.

    Methodology: 扶抑 (Supplement-Suppress) School — the dominant classical approach.
    ─────────────────────────────────────────────────────────────────────
    Principle: restore balance to the chart by helping or restraining the Day Master.

    • 身弱/極弱  → DM needs support
        用神 = element that GENERATES DM (印) + same element as DM (比劫)
        忌神 = element that CONTROLS DM (官殺)

    • 身強/極強  → DM needs draining
        用神 = element DM GENERATES (食傷) + element DM CONTROLS (財)
                + element that CONTROLS DM (官殺, for 極強)
        忌神 = element that GENERATES DM (印) + same element as DM (比劫)

    • 均衡       → target the weakest element for support, suppress the strongest
        用神 = element that generates the weakest element in chart
        忌神 = dominant element (if not DM)

    Note: 調候 (climate adjustment) and 通關 (mediating link) considerations are
    deliberately excluded to keep the calculation deterministic and consistent.
    ─────────────────────────────────────────────────────────────────────
    """
    dm_gen   = ELEM_GENERATES[dm_element]              # what DM generates  (食傷)
    dm_ctrl  = ELEM_CONTROLS[dm_element]               # what DM controls   (財)
    gen_dm   = next(e for e, g in ELEM_GENERATES.items() if g == dm_element)  # 印
    ctrl_dm  = next(e for e, c in ELEM_CONTROLS.items() if c == dm_element)   # 官殺

    if body_strength in ("極弱", "身弱"):
        yong = [gen_dm, dm_element]                 # 印 + 比劫
        ji   = [ctrl_dm]                            # 官殺 primary
        note = f"日主{body_strength}，以{gen_dm}（印）及{dm_element}（比劫）扶身為用神；{ctrl_dm}（官殺）為忌神"

    elif body_strength in ("極強", "身強"):
        yong = [dm_gen, dm_ctrl]                    # 食傷 + 財
        if body_strength == "極強":
            yong.append(ctrl_dm)                    # add 官殺 when extremely strong
        ji   = [gen_dm, dm_element]                 # 印 + 比劫 become unfavorable
        note = f"日主{body_strength}，以{dm_gen}（食傷）、{dm_ctrl}（財）洩秀耗身為用神；{gen_dm}（印）及{dm_element}（比劫）為忌神"

    else:  # 均衡
        sorted_elems = sorted(five_elements_strength.items(), key=lambda x: x[1])
        weakest  = sorted_elems[0][0]
        strongest = sorted_elems[-1][0]
        gen_weakest  = next(e for e, g in ELEM_GENERATES.items() if g == weakest)
        ctrl_strongest = next(e for e, c in ELEM_CONTROLS.items() if c == strongest)
        yong = list({gen_weakest, weakest, ctrl_strongest} - {dm_element})
        ji   = [strongest] if strongest != dm_element else []
        note = f"日主均衡，補最弱（{weakest}）、抑最強（{strongest}）"

    # Remove duplicates while preserving order
    seen: set = set()
    yong_dedup = [e for e in yong if not (e in seen or seen.add(e))]  # type: ignore
    seen = set()
    ji_dedup   = [e for e in ji   if not (e in seen or seen.add(e))]  # type: ignore

    return {
        "yong_shen":   yong_dedup,
        "ji_shen":     ji_dedup,
        "methodology": "扶抑 (Supplement-Suppress)",
        "reasoning":   note,
    }


# ── 4. 空亡 (Void Branches) ──────────────────────────────────────────

def calculate_kong_wang(pillars: Dict) -> Dict:
    """
    Calculate 空亡 (旬空, void/empty branches) from the Day Pillar's position
    in the 60-甲子 cycle.

    Algorithm:
      The 60-cycle is divided into 6 旬 (groups of 10). Each 旬 starts on a
      甲-stem day and uses 10 of the 12 earthly branches sequentially, leaving
      2 branches unused — those are the 空亡 branches.

      旬 starting branch index = (day_zhi_index − day_gan_index) mod 12
      Void branch indices      = (start + 10) mod 12  and  (start + 11) mod 12

    Verification table:
      甲子旬 (start=Zi=0)  → void Xu(10), Hai(11)
      甲戌旬 (start=Xu=10) → void Shen(8), You(9)
      甲申旬 (start=Shen=8)→ void Wu(6),  Wei(7)
      甲午旬 (start=Wu=6)  → void Chen(4), Si(5)
      甲辰旬 (start=Chen=4)→ void Yin(2),  Mao(3)
      甲寅旬 (start=Yin=2) → void Zi(0),   Chou(1)
    """
    day_gan = pillars["day"]["gan"]
    day_zhi = pillars["day"]["zhi"]
    gan_idx = GAN.index(day_gan)
    zhi_idx = ZHI.index(day_zhi)

    xun_start = (zhi_idx - gan_idx) % 12
    v1 = (xun_start + 10) % 12
    v2 = (xun_start + 11) % 12

    void_en = [ZHI[v1], ZHI[v2]]
    void_cn = [ZHI_CN[v1], ZHI_CN[v2]]

    # Check which chart positions contain a void branch
    present: List[str] = []
    for pos, pillar in pillars.items():
        if pillar["zhi"] in void_en:
            present.append(f"{pos}({pillar['zhi']})")

    return {
        "void_branches":    void_en,
        "void_branches_cn": void_cn,
        "xun_start":        ZHI[xun_start],
        "xun_start_cn":     ZHI_CN[xun_start],
        "present_in_chart": present,   # positions where void branch appears
    }


# ── 5. 流年 (Annual Pillar) ──────────────────────────────────────────

def calculate_liunian(year: Optional[int] = None) -> Dict:
    """
    Calculate 流年 (the ganzhi pillar for a given calendar year, default: current year).
    Reuses the same sxtwl year-ganzhi lookup already used for birth-year calculation,
    which internally accounts for the 立春 year boundary.
    """
    target_year = year if year is not None else datetime.now().year
    # June 1 is safely inside the 立春-to-立春 window for the target year,
    # away from the Jan/Feb boundary edge case.
    lunar = sxtwl.fromSolar(target_year, 6, 1)
    gz = lunar.getYearGZ()
    gan, zhi = GAN[gz.tg], ZHI[gz.dz]
    return {
        "year": target_year,
        "gan": gan,
        "zhi": zhi,
        "gan_cn": GAN_CN[GAN.index(gan)],
        "zhi_cn": ZHI_CN[ZHI.index(zhi)],
        "pillar_cn": GAN_CN[GAN.index(gan)] + ZHI_CN[ZHI.index(zhi)],
    }


# ── 6. 財庫 (Element Vaults) ─────────────────────────────────────────

# The four Earth branches, each the classical 墓/庫 (storage) position for one element.
FOUR_VAULTS: Dict[str, str] = {
    "Chen": "Water",
    "Xu":   "Fire",
    "Chou": "Metal",
    "Wei":  "Wood",
}

# 地支六沖 (Six Branch Clashes) — full table, though vault-triggering only uses
# the Chen/Xu and Chou/Wei pairs.
SIX_CLASH: Dict[str, str] = {
    "Zi": "Wu", "Wu": "Zi",
    "Chou": "Wei", "Wei": "Chou",
    "Yin": "Shen", "Shen": "Yin",
    "Mao": "You", "You": "Mao",
    "Chen": "Xu", "Xu": "Chen",
    "Si": "Hai", "Hai": "Si",
}

_VAULT_RELATION_LABEL: Dict[str, str] = {
    "compare":  "比劫庫",   # same element as DM
    "resource": "印庫",     # generates DM
    "output":   "食傷庫",   # DM generates
    "wealth":   "財庫",     # DM controls
    "officer":  "官殺庫",   # controls DM
}


def _vault_relation(dm_elem: str, stored_elem: str) -> str:
    """Classify a stored element's relationship to the Day Master's element."""
    if stored_elem == dm_elem:
        return "compare"
    if ELEM_GENERATES[dm_elem] == stored_elem:
        return "output"
    if ELEM_CONTROLS[dm_elem] == stored_elem:
        return "wealth"
    if ELEM_GENERATES[stored_elem] == dm_elem:
        return "resource"
    # ELEM_CONTROLS[stored_elem] == dm_elem
    return "officer"


def _vault_hidden_stems(
    day_master: str, dm_elem: str, zhi: str, vault_element: str,
    all_gans: set, month_qi: Optional[str],
) -> Tuple[List[Dict], bool]:
    """
    Detail every hidden stem (藏干) inside a 墓庫 branch, each converted to its
    precise 十神 relative to the Day Master via the existing get_ten_god() /
    ZHI_HIDDEN table (module-level, shared with calculate_ten_gods() and
    classify_body_strength() — not duplicated here).

    Returns (detail, mixed):
      detail — one entry per hidden stem, primary (the branch's traditional
        墓庫 element) sorted first, then by relevance (透干 > in-season > weight).
      mixed  — True when a non-primary hidden stem carries non-trivial weight
        (>=0.2) AND maps to a different 十神 relation category than the
        traditional element — i.e. this branch should NOT be reduced to one
        label without qualification.
    """
    vault_relation = _vault_relation(dm_elem, vault_element)
    detail: List[Dict] = []
    mixed = False

    for hs, weight in ZHI_HIDDEN[zhi]:
        hs_elem = GAN_ELEMENT[hs]
        hs_relation = _vault_relation(dm_elem, hs_elem)
        is_vault_element = (hs_elem == vault_element)
        if not is_vault_element and weight >= 0.2 and hs_relation != vault_relation:
            mixed = True
        detail.append({
            "stem":            hs,
            "stem_cn":         GAN_CN[GAN.index(hs)],
            "element":         hs_elem,
            "weight":          weight,
            "ten_god":         get_ten_god(day_master, hs),
            "relation":        hs_relation,
            "is_vault_element": is_vault_element,
            "is_toutian":      hs in all_gans,
            "in_season":       bool(month_qi) and hs_elem == month_qi,
        })

    def _sort_key(d: Dict):
        relevance = d["weight"] + (0.5 if d["is_toutian"] else 0) + (0.3 if d["in_season"] else 0)
        return (0 if d["is_vault_element"] else 1, -relevance)

    detail.sort(key=_sort_key)
    return detail, mixed


def _vault_activation_relations(
    zhi: str, other_branches: Dict[str, str],
    current_dayun_branch: Optional[str], current_liunian_branch: Optional[str],
) -> List[Dict]:
    """
    Structural activation facts only — no judgment about whether activation is
    good or bad. Currently only 地支六沖 (clash) is implemented; 合/刑/害/破 are
    not yet detected anywhere in this module, so `type` is always 'clash' today.
    The shape supports adding them later without changing this function's
    callers (see _vault_status_from_relations for how status is derived).
    """
    clash_partner = SIX_CLASH[zhi]
    relations: List[Dict] = []

    for other_pos, other_zhi in other_branches.items():
        if other_zhi == clash_partner:
            relations.append({
                "type": "clash", "source_branch": zhi, "target_branch": clash_partner,
                "source": "natal", "source_position": other_pos,
            })
    if current_dayun_branch == clash_partner:
        relations.append({"type": "clash", "source_branch": zhi, "target_branch": clash_partner, "source": "dayun"})
    if current_liunian_branch == clash_partner:
        relations.append({"type": "clash", "source_branch": zhi, "target_branch": clash_partner, "source": "liunian"})

    return relations


def _vault_status_from_relations(relations: List[Dict]) -> str:
    """
    'closed'    – no activation relation detected.
    'activated' – a single, structurally unambiguous relation type is present
                  (today: only 沖/clash).
    'disturbed' – reserved for multiple conflicting relation types (e.g. clash
                  + harm pulling in different directions). Not reachable yet —
                  合/刑/害/破 detection doesn't exist in this module.
    'uncertain' – reserved for relation types with inherently ambiguous outcome
                  (e.g. 合 can change the branch's effective element entirely).
                  Not reachable yet, same reason as above.
    Extending with 合/刑/害/破 later only requires branching here — the rest of
    calculate_wealth_vault() and its callers are agnostic to relation type.
    """
    if not relations:
        return "closed"
    return "activated"


def _vault_favorability(stored_elem: str, yong_shen: Optional[List[str]], ji_shen: Optional[List[str]]) -> str:
    """
    'unknown' when both yong_shen and ji_shen are omitted (None) — i.e. no
    reliable 用神/忌神 result was available to the caller. Do not default this
    to 'neutral': neutral is itself a judgment ("checked and it doesn't
    matter"), which is different from "wasn't checked".
    """
    if yong_shen is None and ji_shen is None:
        return "unknown"
    if stored_elem in (yong_shen or []):
        return "favorable"
    if stored_elem in (ji_shen or []):
        return "unfavorable"
    return "neutral"


def _vault_confidence(favorability: str, mixed_hidden_stems: bool, status: str) -> str:
    if favorability == "unknown":
        return "low"
    if mixed_hidden_stems or status in ("disturbed", "uncertain"):
        return "medium"
    return "high"


def _vault_notes(favorability: str, mixed_hidden_stems: bool) -> List[str]:
    """Methodological caveats, not narrative interpretation — kept factual/hedged."""
    notes = [
        "庫位僅反映特定五行的收藏與引動狀態，不能單獨決定整體命局吉凶，仍需配合日主旺衰、用神忌神及大運流年整體判斷。",
    ]
    if mixed_hidden_stems:
        notes.append("此庫位內藏有多個屬性不同的天干，無法只歸類為單一十神主題，實際重點需視日主旺衰而定。")
    if favorability == "unknown":
        notes.append("尚未取得可靠的用神／忌神判斷資料，此庫位傾向於有利或不利暫時無法判斷。")
    return notes


def _wealth_relation_status(vaults: List[Dict]) -> str:
    """
    Top-level summary used to distinguish the 財庫 conclusion cases explicitly
    requested by product copy:
      'none'               – no 辰戌丑未 in the chart at all.
      'no_wealth_vault'     – 墓庫 branches exist, but none classify as 財 (財星相關庫位).
      'wealth_vault_inactive' – a 財星相關庫位 exists but none are activated.
      'wealth_vault_activated' – at least one 財星相關庫位 is activated.
    """
    if not vaults:
        return "none"
    wealth_vaults = [v for v in vaults if v["is_wealth_vault"]]
    if not wealth_vaults:
        return "no_wealth_vault"
    if any(v["status"] == "activated" for v in wealth_vaults):
        return "wealth_vault_activated"
    return "wealth_vault_inactive"


def calculate_wealth_vault(
    pillars: Dict,
    yong_shen: Optional[List[str]] = None,
    ji_shen: Optional[List[str]] = None,
    current_dayun_branch: Optional[str] = None,
    current_liunian_branch: Optional[str] = None,
) -> Dict:
    """
    Detect 墓庫 positions (辰/戌/丑/未) in the chart and return structured facts
    about each — separately from any interpretive judgment about whether that's
    good or bad for the person.

    Factual layer (always computed, does not depend on 用神/忌神):
      - which branch, which traditional storage element (FOUR_VAULTS — a fixed
        十二長生 墓 assignment, independent of this branch's actual hidden-stem
        weights)
      - the branch's real 藏干 composition, each converted to its precise 十神
        (see _vault_hidden_stems) — a branch is NOT reduced to one label when
        multiple hidden stems carry meaningfully different 十神 categories
      - activation_relations: structural 沖 (clash) facts only, tagged by
        source (natal / dayun / liunian) and kept separate — see
        _vault_activation_relations. 合/刑/害/破 are not implemented (this
        module has no existing logic for them); the relation `type` field and
        `_vault_status_from_relations` are already shaped to add them later.
      - status ('closed' | 'activated' | 'disturbed' | 'uncertain') is a
        structural fact about whether/how the branch is being triggered — it
        is NOT a judgment about outcome.

    Interpretive layer (only when 用神/忌神 data is supplied):
      - favorability ('favorable' | 'unfavorable' | 'neutral' | 'unknown') —
        'unknown' when yong_shen/ji_shen are both omitted, rather than
        silently defaulting to 'neutral'.
      - confidence ('high' | 'medium' | 'low') — lowered when favorability is
        unknown or the branch's hidden stems are mixed.

    Callers/UI must not assume 'activated' == good news or 'closed' == safe;
    that always depends on `favorability`, which may itself be 'unknown'.
    """
    day_master = pillars["day"]["gan"]
    dm_elem = GAN_ELEMENT[day_master]
    branches = {pos: p["zhi"] for pos, p in pillars.items()}
    all_gans = {p["gan"] for p in pillars.values()}
    month_branch = pillars.get("month", {}).get("zhi")
    month_qi = MONTH_BRANCH_QI.get(month_branch) if month_branch else None

    vaults: List[Dict] = []

    for pos, zhi in branches.items():
        if zhi not in FOUR_VAULTS:
            continue

        stored_elem = FOUR_VAULTS[zhi]
        relation = _vault_relation(dm_elem, stored_elem)
        other_branches = {p: z for p, z in branches.items() if p != pos}

        relations = _vault_activation_relations(zhi, other_branches, current_dayun_branch, current_liunian_branch)
        status = _vault_status_from_relations(relations)
        natal_status = _vault_status_from_relations([r for r in relations if r["source"] == "natal"])

        # Preserve legacy priority ordering (natal, dayun, liunian) rather than
        # an arbitrary set order, since existing callers compare this list.
        present_sources = {r["source"] for r in relations}
        triggers = [t for t in ("natal", "dayun", "liunian") if t in present_sources]

        hidden_stems, mixed = _vault_hidden_stems(day_master, dm_elem, zhi, stored_elem, all_gans, month_qi)

        favorability = _vault_favorability(stored_elem, yong_shen, ji_shen)
        confidence = _vault_confidence(favorability, mixed, status)
        notes = _vault_notes(favorability, mixed)

        # Legacy convenience field for any pre-existing consumer expecting the
        # old 5-way label. Derived, not authoritative — new code should read
        # `favorability` + `status` directly instead.
        if favorability in ("favorable", "unfavorable"):
            legacy_reading = f"{favorability}_{'open' if status != 'closed' else 'closed'}"
        else:
            legacy_reading = "neutral"

        vaults.append({
            "position":        pos,
            "branch":          zhi,
            "branch_cn":       ZHI_CN[ZHI.index(zhi)],
            "stored_element":  stored_elem,
            "relation":        relation,
            "relation_label":  _VAULT_RELATION_LABEL[relation],
            "is_wealth_vault": relation == "wealth",

            "hidden_stems":        hidden_stems,
            "mixed_hidden_stems":  mixed,

            "activation_relations": relations,
            "status":              status,
            "natal_status":        natal_status,
            "triggers":            triggers,

            "favorability": favorability,
            "confidence":   confidence,
            "notes":        notes,
            "reading":      legacy_reading,
        })

    return {
        "vaults":                 vaults,
        "has_vault":               len(vaults) > 0,
        "has_wealth_vault":        any(v["is_wealth_vault"] for v in vaults),
        "wealth_relation_status":  _wealth_relation_status(vaults),
    }


# ── Master function ──────────────────────────────────────────────────

def calculate_advanced_bazi(
    pillars: Dict,
    five_elements_strength: Dict,
    current_dayun_branch: Optional[str] = None,
    current_liunian_branch: Optional[str] = None,
) -> Dict:
    """
    Calculate all advanced BaZi attributes in one call.
    Requires pillars dict with at least year/month/day keys.

    current_dayun_branch: pass the person's current 大運 branch (e.g. from
      calculate_dayun()['current_dayun']['branch_en']) to enable dayun-triggered
      vault detection. Omit if gender/大運 is not available.
    current_liunian_branch: defaults to the current calendar year's branch via
      calculate_liunian() if not supplied.
    """
    day_master = pillars["day"]["gan"]
    dm_element = GAN_ELEMENT[day_master]

    ten_gods      = calculate_ten_gods(pillars)
    strength_data = classify_body_strength(pillars)
    body_strength = strength_data["classification"]
    yong_ji       = calculate_yong_ji_shen(dm_element, body_strength,
                                           five_elements_strength)
    kong_wang     = calculate_kong_wang(pillars)

    if current_liunian_branch is None:
        current_liunian_branch = calculate_liunian()["zhi"]
    wealth_vault = calculate_wealth_vault(
        pillars, yong_ji["yong_shen"], yong_ji["ji_shen"],
        current_dayun_branch, current_liunian_branch,
    )

    return {
        "ten_gods":      ten_gods,
        "body_strength": strength_data,
        "yong_ji_shen":  yong_ji,
        "kong_wang":     kong_wang,
        "wealth_vault":  wealth_vault,
    }


# ── Self-test ────────────────────────────────────────────────────────

def _run_advanced_tests():
    """
    Verify 十神, 身强/身弱, 用神/忌神, 空亡 against hand-calculated reference charts.
    Prints PASS / FAIL for each assertion.
    """
    errors: List[str] = []

    def check(label: str, got, expected):
        if got != expected:
            errors.append(f"FAIL  {label}: got={got!r} expected={expected!r}")
        else:
            print(f"  PASS  {label}")

    print("\n" + "=" * 60)
    print("ADVANCED BAZI TESTS")
    print("=" * 60)

    # ── Test A: 十神 table for Day Master 甲 (Jia, Yang Wood) ──
    print("\n[A] 十神 — Day Master 甲 (Yang Wood)")
    expected_tg = {
        "乙": "劫財", "丙": "食神", "丁": "傷官",
        "戊": "偏財", "己": "正財", "庚": "七殺",
        "辛": "正官", "壬": "偏印", "癸": "正印",
    }
    cn_to_en = dict(zip(GAN_CN, GAN))
    for cn, expected_god in expected_tg.items():
        en_stem = cn_to_en[cn]
        got = get_ten_god("Jia", en_stem)
        check(f"甲 vs {cn}", got, expected_god)

    # ── Test B: 十神 table for Day Master 癸 (Gui, Yin Water) ──
    print("\n[B] 十神 — Day Master 癸 (Yin Water)")
    expected_tg_gui = {
        "壬": "劫財", "甲": "傷官", "乙": "食神",
        "丙": "正財", "丁": "偏財", "戊": "正官",
        "己": "七殺", "庚": "正印", "辛": "偏印",
    }
    for cn, expected_god in expected_tg_gui.items():
        en_stem = cn_to_en[cn]
        got = get_ten_god("Gui", en_stem)
        check(f"癸 vs {cn}", got, expected_god)

    # ── Test C: 空亡 verification against all 6 旬 ──
    print("\n[C] 空亡 — 6 旬 verification")
    xun_tests = [
        # (day_gan, day_zhi, expected_void)
        ("Jia", "Zi",   ["Xu", "Hai"]),   # 甲子旬
        ("Jia", "Xu",   ["Shen", "You"]), # 甲戌旬
        ("Jia", "Shen", ["Wu", "Wei"]),   # 甲申旬
        ("Jia", "Wu",   ["Chen", "Si"]),  # 甲午旬
        ("Jia", "Chen", ["Yin", "Mao"]),  # 甲辰旬
        ("Jia", "Yin",  ["Zi", "Chou"]),  # 甲寅旬
        # same 旬, different day
        ("Yi",  "Chou", ["Xu", "Hai"]),   # 甲子旬 (乙丑)
        ("Gui", "You",  ["Xu", "Hai"]),   # 甲子旬 (癸酉)
        ("Bing","Zi",   ["Shen", "You"]), # 甲戌旬 (丙子)
    ]
    for gan, zhi, expected_void in xun_tests:
        fake_pillars = {"day": {"gan": gan, "zhi": zhi},
                        "year": {"gan": gan, "zhi": zhi},
                        "month": {"gan": gan, "zhi": zhi}}
        kw = calculate_kong_wang(fake_pillars)
        check(f"空亡 {GAN_CN[GAN.index(gan)]}{ZHI_CN[ZHI.index(zhi)]}",
              kw["void_branches"], expected_void)

    # ── Test D: 得令 for all elements across all months ──
    print("\n[D] 得令 — seasonal support")
    # Wood DM should be 得令 in Yin/Mao (旺) and Hai (相)
    for branch, expect_ling in [("Yin", True), ("Mao", True), ("Hai", True),
                                 ("Si", False), ("You", False)]:
        fake_pillars = {
            "year":  {"gan": "Jia", "zhi": "Zi"},
            "month": {"gan": "Jia", "zhi": branch},
            "day":   {"gan": "Jia", "zhi": "Zi"},
        }
        result = classify_body_strength(fake_pillars)
        check(f"Wood 得令 month={branch}", result["de_ling"]["result"], expect_ling)

    # ── Test E: 用神/忌神 basic direction ──
    print("\n[E] 用神/忌神 direction")
    fe = {"Wood": 0.5, "Fire": 0.5, "Earth": 0.5, "Metal": 0.5, "Water": 0.5}
    # Weak Wood DM → should favor Water (generates Wood) and Wood (same)
    yj_weak = calculate_yong_ji_shen("Wood", "身弱", fe)
    check("身弱 Wood yong includes Water", "Water" in yj_weak["yong_shen"], True)
    check("身弱 Wood yong includes Wood",  "Wood"  in yj_weak["yong_shen"], True)
    check("身弱 Wood ji includes Metal",   "Metal" in yj_weak["ji_shen"],   True)

    # Strong Wood DM → should favor Fire (食傷) and Earth (財)
    yj_strong = calculate_yong_ji_shen("Wood", "身強", fe)
    check("身強 Wood yong includes Fire",  "Fire"  in yj_strong["yong_shen"], True)
    check("身強 Wood yong includes Earth", "Earth" in yj_strong["yong_shen"], True)
    check("身強 Wood ji includes Water",   "Water" in yj_strong["ji_shen"],   True)

    # ── Test F: Full chart — 1966-10-09 07:00 HK (test chart from bazi.py) ──
    print("\n[F] Full advanced calc — 1966-10-09 chart")
    dt = datetime(1966, 10, 9, 7, 0)
    chart = calc_bazi_fixed(dt, "Asia/Hong_Kong", 114.1095)
    advanced = calculate_advanced_bazi(chart["pillars"], chart["five_elements_strength"])

    # Day master should be deterministic
    dm = chart["day_master"]
    print(f"  Day Master: {dm} ({GAN_ELEMENT[dm]} {'yang' if GAN_POLARITY[dm]=='yang' else 'yin'})")
    print(f"  Pillars: ", end="")
    for pos in ("year", "month", "day", "hour"):
        if pos in chart["pillars"]:
            p = chart["pillars"][pos]
            g_cn = GAN_CN[GAN.index(p["gan"])]
            z_cn = ZHI_CN[ZHI.index(p["zhi"])]
            print(f"{pos}={g_cn}{z_cn}", end=" ")
    print()

    tg = advanced["ten_gods"]["by_position"]
    print(f"  十神 year={tg['year']['ten_god']} month={tg['month']['ten_god']} "
          f"hour={tg['hour']['ten_god']}")
    print(f"  身強弱: {advanced['body_strength']['classification']}")
    print(f"  用神: {advanced['yong_ji_shen']['yong_shen']}")
    print(f"  忌神: {advanced['yong_ji_shen']['ji_shen']}")
    print(f"  空亡: {advanced['kong_wang']['void_branches_cn']} "
          f"| in chart: {advanced['kong_wang']['present_in_chart']}")

    # ── Test G: 流年 — known reference year ──
    print("\n[G] 流年 — 2026 reference check")
    ln = calculate_liunian(2026)
    check("2026 流年 gan", ln["gan"], "Bing")
    check("2026 流年 zhi", ln["zhi"], "Wu")  # 2026 = 丙午, Year of the Horse

    # ── Test H: 財庫 — vault present but NOT the wealth god for this DM ──
    print("\n[H] 財庫 — 戌 vault storing Fire, Fire-DM (should be 比劫庫, not 財庫)")
    pillars_h = {
        "year":  {"gan": "Bing", "zhi": "Xu"},
        "month": {"gan": "Geng", "zhi": "Yin"},
        "day":   {"gan": "Bing", "zhi": "Yin"},
        "hour":  {"gan": "Geng", "zhi": "Yin"},
    }
    wv_h = calculate_wealth_vault(pillars_h, yong_shen=[], ji_shen=[])
    check("H vault count", len(wv_h["vaults"]), 1)
    check("H relation is compare (比劫庫)", wv_h["vaults"][0]["relation"], "compare")
    check("H is NOT a wealth vault", wv_h["has_wealth_vault"], False)
    check("H status closed (no clash partner present)", wv_h["vaults"][0]["status"], "closed")

    # ── Test I: 財庫 — genuine wealth vault, favorable + closed ──
    print("\n[I] 財庫 — 未 vault storing Wood, Metal-DM (genuine 財庫)")
    pillars_i = {
        "year":  {"gan": "Geng", "zhi": "Wei"},
        "month": {"gan": "Jia",  "zhi": "Zi"},
        "day":   {"gan": "Geng", "zhi": "Zi"},
    }
    wv_i = calculate_wealth_vault(pillars_i, yong_shen=["Wood"], ji_shen=[])
    check("I relation is wealth (財庫)", wv_i["vaults"][0]["relation"], "wealth")
    check("I IS a wealth vault", wv_i["has_wealth_vault"], True)
    check("I status closed", wv_i["vaults"][0]["status"], "closed")
    check("I reading favorable_closed", wv_i["vaults"][0]["reading"], "favorable_closed")

    # ── Test J: natal clash — Chen + Xu co-present should mutually open ──
    print("\n[J] 財庫 — natal clash (辰 + 戌 co-present)")
    pillars_j = {
        "year":  {"gan": "Bing", "zhi": "Chen"},
        "month": {"gan": "Jia",  "zhi": "Zi"},
        "day":   {"gan": "Geng", "zhi": "Xu"},
    }
    wv_j = calculate_wealth_vault(pillars_j, yong_shen=[], ji_shen=[])
    check("J vault count (Chen + Xu both detected)", len(wv_j["vaults"]), 2)
    check("J all vaults activated via natal clash",
          all(v["status"] == "activated" and v["triggers"] == ["natal"] for v in wv_j["vaults"]), True)

    # ── Test K: dayun-triggered vault (not natally clashed) ──
    print("\n[K] 財庫 — 未 vault, closed natally, opened by current 大運")
    pillars_k = {
        "year":  {"gan": "Yi",  "zhi": "Wei"},
        "month": {"gan": "Jia", "zhi": "Zi"},
        "day":   {"gan": "Yi",  "zhi": "Si"},
    }
    wv_k_closed = calculate_wealth_vault(pillars_k, yong_shen=[], ji_shen=[])
    check("K closed without dayun/liunian", wv_k_closed["vaults"][0]["status"], "closed")
    wv_k_open = calculate_wealth_vault(pillars_k, yong_shen=[], ji_shen=[], current_dayun_branch="Chou")
    check("K activated by matching 大運 branch (丑)", wv_k_open["vaults"][0]["status"], "activated")
    check("K trigger source is dayun", wv_k_open["vaults"][0]["triggers"], ["dayun"])

    # ── Test L: liunian-triggered vault ──
    print("\n[L] 財庫 — same chart, activated by current 流年 instead")
    wv_l_open = calculate_wealth_vault(pillars_k, yong_shen=[], ji_shen=[], current_liunian_branch="Chou")
    check("L activated by matching 流年 branch (丑)", wv_l_open["vaults"][0]["status"], "activated")
    check("L trigger source is liunian", wv_l_open["vaults"][0]["triggers"], ["liunian"])

    # ── Test M: no vault in chart at all ──
    print("\n[M] 財庫 — chart with no 辰戌丑未 at all")
    pillars_m = {
        "year":  {"gan": "Jia",  "zhi": "Zi"},
        "month": {"gan": "Bing", "zhi": "Wu"},
        "day":   {"gan": "Yi",   "zhi": "Mao"},
        "hour":  {"gan": "Xin",  "zhi": "You"},
    }
    wv_m = calculate_wealth_vault(pillars_m, yong_shen=[], ji_shen=[])
    check("M no vaults found", wv_m["has_vault"], False)

    # ── Test N: end-to-end via calculate_advanced_bazi (liunian auto-filled) ──
    print("\n[N] 財庫 — wired through calculate_advanced_bazi()")
    advanced_n = calculate_advanced_bazi(pillars_h, {"Wood": 1, "Fire": 3, "Earth": 0.5, "Metal": 2, "Water": 0})
    check("N wealth_vault key present", "wealth_vault" in advanced_n, True)
    check("N still finds the 戌 vault", len(advanced_n["wealth_vault"]["vaults"]), 1)

    # =====================================================================
    # 庫位 (storage) interpretation-safety spec — Cases A-H
    # =====================================================================

    # ── Case A: closed favorable storage ──
    print("\n[Case A] closed + favorable — 未 vault storing Wood, yong_shen includes Wood, no clash")
    wv_a = calculate_wealth_vault(pillars_i, yong_shen=["Wood"], ji_shen=[])
    v_a = wv_a["vaults"][0]
    check("A status closed", v_a["status"], "closed")
    check("A favorability favorable", v_a["favorability"], "favorable")
    check("A confidence not low (favorability known, not mixed)", v_a["confidence"] in ("high", "medium"), True)

    # ── Case B: closed unfavorable storage ──
    print("\n[Case B] closed + unfavorable — 戌 vault storing Fire, ji_shen includes Fire, no clash")
    wv_b = calculate_wealth_vault(pillars_h, yong_shen=[], ji_shen=["Fire"])
    v_b = wv_b["vaults"][0]
    check("B status closed", v_b["status"], "closed")
    check("B favorability unfavorable", v_b["favorability"], "unfavorable")
    # Must not claim total protection — confidence alone doesn't assert wording,
    # but the structured status/favorability must stay separate so the copy
    # layer can only ever say "less visible / contained", never "safe".
    check("B status is not itself a safety claim (stays a plain enum)", v_b["status"] in ("closed", "activated", "disturbed", "uncertain"), True)

    # ── Case C: activated favorable storage ──
    print("\n[Case C] activated + favorable — 未(year) + 丑(hour) mutual clash, Wood favorable")
    pillars_c = {
        "year":  {"gan": "Geng", "zhi": "Wei"},
        "month": {"gan": "Jia",  "zhi": "Zi"},
        "day":   {"gan": "Geng", "zhi": "Zi"},
        "hour":  {"gan": "Xin",  "zhi": "Chou"},
    }
    wv_c = calculate_wealth_vault(pillars_c, yong_shen=["Wood"], ji_shen=[])
    v_c = next(v for v in wv_c["vaults"] if v["branch"] == "Wei")
    check("C status activated", v_c["status"], "activated")
    check("C favorability favorable", v_c["favorability"], "favorable")
    check("C has a natal clash activation relation", any(r["type"] == "clash" and r["source"] == "natal" for r in v_c["activation_relations"]), True)

    # ── Case D: activated unfavorable storage ──
    print("\n[Case D] activated + unfavorable — same clash structure, Wood unfavorable instead")
    wv_d = calculate_wealth_vault(pillars_c, yong_shen=[], ji_shen=["Wood"])
    v_d = next(v for v in wv_d["vaults"] if v["branch"] == "Wei")
    check("D status activated (or disturbed)", v_d["status"] in ("activated", "disturbed"), True)
    check("D favorability unfavorable", v_d["favorability"], "unfavorable")

    # ── Case E: favorability unknown ──
    print("\n[Case E] favorability unknown — yong_shen/ji_shen not supplied")
    wv_e = calculate_wealth_vault(pillars_i, yong_shen=None, ji_shen=None)
    v_e = wv_e["vaults"][0]
    check("E favorability unknown", v_e["favorability"], "unknown")
    check("E confidence low", v_e["confidence"], "low")

    # ── Case F: mixed hidden stems ──
    print("\n[Case F] mixed hidden stems — 戌 vault (Bing/Fire DM): 戊土/辛金/丁火 map to different 十神")
    wv_f = calculate_wealth_vault(pillars_h, yong_shen=[], ji_shen=[])
    v_f = wv_f["vaults"][0]
    check("F retains all 3 hidden stems", len(v_f["hidden_stems"]), 3)
    check("F flagged as mixed", v_f["mixed_hidden_stems"], True)
    hidden_relations = {hs["relation"] for hs in v_f["hidden_stems"]}
    check("F hidden stems span >1 十神 relation category", len(hidden_relations) > 1, True)

    # ── Case G: no strict 財庫 ──
    print("\n[Case G] no 財星相關庫位 — same 戌/Fire-DM chart has a vault, but it's not wealth-related")
    check("G has_wealth_vault False", wv_f["has_wealth_vault"], False)
    check("G wealth_relation_status is no_wealth_vault", wv_f["wealth_relation_status"], "no_wealth_vault")

    # ── Case H: external timing activation (natal branch, annual clash) ──
    print("\n[Case H] natal 戌, annual (流年) 辰 — annual activation recorded separately from natal status")
    wv_h_timing = calculate_wealth_vault(pillars_h, yong_shen=[], ji_shen=[], current_liunian_branch="Chen")
    v_h_timing = wv_h_timing["vaults"][0]
    check("H natal_status stays closed (chart itself has no 辰)", v_h_timing["natal_status"], "closed")
    check("H overall status activated via liunian", v_h_timing["status"], "activated")
    check("H activation_relations records liunian source", any(r["source"] == "liunian" and r["type"] == "clash" and r["target_branch"] == "Chen" for r in v_h_timing["activation_relations"]), True)
    check("H triggers list is liunian only", v_h_timing["triggers"], ["liunian"])

    # ── Equation of time precision (Phase 2 of accuracy engine plan) ──
    print("\n[EOT] Equation of time — Meeus multi-term series vs. known reference dates")

    def check_approx(label: str, got: float, expected: float, tol: float):
        if abs(got - expected) > tol:
            errors.append(f"FAIL  {label}: got={got!r} expected~={expected!r} (tol={tol})")
        else:
            print(f"  PASS  {label} (got={got:.2f} min, expected~={expected} min)")

    # Reference extrema of the equation of time (widely published, e.g. NOAA /
    # Meeus): early Feb minimum (~-14.2 min), mid-May local max (~+3.7 min),
    # late-Jul local minimum (~-6.4 min), early Nov maximum (~+16.4 min).
    check_approx("2024-02-11 (near annual minimum)", _equation_of_time_minutes(datetime(2024, 2, 11, 12, tzinfo=timezone.utc)), -14.2, 0.6)
    check_approx("2024-05-14 (near local max)", _equation_of_time_minutes(datetime(2024, 5, 14, 12, tzinfo=timezone.utc)), 3.7, 0.6)
    check_approx("2024-07-26 (near local minimum)", _equation_of_time_minutes(datetime(2024, 7, 26, 12, tzinfo=timezone.utc)), -6.4, 0.6)
    check_approx("2024-11-03 (near annual maximum)", _equation_of_time_minutes(datetime(2024, 11, 3, 12, tzinfo=timezone.utc)), 16.4, 0.6)
    # Sanity check that older birth years (pre-J2000) don't blow up or drift wildly
    check_approx("1968-02-11 (older date, same seasonal position)", _equation_of_time_minutes(datetime(1968, 2, 11, 12, tzinfo=timezone.utc)), -14.2, 1.0)

    # ── Zi-hour convention split (Phase 3 of accuracy engine plan) ──
    print("\n[ZI] 子時 convention — 'advance' (whole 23:00-01:00 -> next day) vs 'split' (23:00-23:59 stays same day)")

    from zoneinfo import ZoneInfo as _ZI
    # Use longitude=120.0 (matches tz_name's standard meridian) and a date/time
    # far from any solar-term boundary so eot+longitude correction can't
    # accidentally push the true-solar hour outside the 23:xx window.
    zi_dt = datetime(1990, 6, 15, 23, 30, tzinfo=_ZI("Asia/Hong_Kong"))
    r_advance = calc_bazi_fixed(zi_dt, "Asia/Hong_Kong", 120.0, "advance")
    r_split = calc_bazi_fixed(zi_dt, "Asia/Hong_Kong", 120.0, "split")
    check("both conventions agree on hour zhi (子)", (r_advance["pillars"]["hour"]["zhi"], r_split["pillars"]["hour"]["zhi"]), ("Zi", "Zi"))
    check("'advance' day pillar differs from 'split' day pillar for a 23:30 birth", r_advance["pillars"]["day"] != r_split["pillars"]["day"], True)
    check("'advance' hour stem differs from 'split' hour stem (different day-gan base)", r_advance["pillars"]["hour"]["gan"] != r_split["pillars"]["hour"]["gan"], True)
    check("default (no convention passed) matches 'advance'", calc_bazi_fixed(zi_dt, "Asia/Hong_Kong", 120.0)["pillars"], r_advance["pillars"])

    # 00:xx births are unambiguous -- both conventions must agree
    zi_dt_00 = datetime(1990, 6, 16, 0, 30, tzinfo=_ZI("Asia/Hong_Kong"))
    r00_advance = calc_bazi_fixed(zi_dt_00, "Asia/Hong_Kong", 120.0, "advance")
    r00_split = calc_bazi_fixed(zi_dt_00, "Asia/Hong_Kong", 120.0, "split")
    check("00:30 birth: both conventions agree on day pillar", r00_advance["pillars"]["day"], r00_split["pillars"]["day"])
    check("00:30 birth: both conventions agree on hour pillar", r00_advance["pillars"]["hour"], r00_split["pillars"]["hour"])

    if errors:
        print(f"\n{'='*60}")
        print(f"  {len(errors)} FAILURE(S):")
        for e in errors:
            print(f"  {e}")
    else:
        print(f"\n  All assertions PASSED")
    print("=" * 60)
    return len(errors) == 0


if __name__ == "__main__":
    _run_advanced_tests()
