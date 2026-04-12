from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.bazi import calculate_bazi, enrich_with_localized_pillars, analyze_three_pillars
from app.mbti import get_mbti_profile, get_mbti_bazi_combined_context

app = FastAPI(title="oria-analysis-service")

class BaziRequest(BaseModel):
    year: int
    month: int
    day: int
    hour: int = 0
    minute: int = 0
    tz_name: str = "Asia/Hong_Kong"
    location: Optional[str] = None
    time_known: Optional[bool] = None
    lang: str = "en"

class MbtiRequest(BaseModel):
    mbti_type: str
    lang: str = "en"

class ProfileSummaryRequest(BaseModel):
    mbti_type: str
    day_master: str
    dominant_element: str
    lang: str = "en"

@app.get("/health")
def health():
    return {"status": "ok", "service": "oria-analysis-service"}

@app.post("/bazi/calculate")
def bazi_calculate(req: BaziRequest):
    try:
        birth_dt = datetime(req.year, req.month, req.day, req.hour, req.minute)
        result = calculate_bazi(
            birth_date=birth_dt,
            tz_name=req.tz_name,
            location=req.location,
            time_known=req.time_known,
        )
        enrich_with_localized_pillars(result, lang=req.lang)
        analysis = analyze_three_pillars(result, lang=req.lang)
        return {"bazi": result, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mbti/profile")
def mbti_profile(req: MbtiRequest):
    try:
        return get_mbti_profile(req.mbti_type, req.lang)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/profile/combined-context")
def combined_context(req: ProfileSummaryRequest):
    try:
        context = get_mbti_bazi_combined_context(
            mbti_type=req.mbti_type,
            day_master=req.day_master,
            dominant_element=req.dominant_element,
            lang=req.lang,
        )
        return {"context": context}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
