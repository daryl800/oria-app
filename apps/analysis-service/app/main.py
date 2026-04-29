from fastapi import FastAPI, HTTPException
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.bazi import calculate_bazi, enrich_with_localized_pillars, analyze_three_pillars, calculate_dayun
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
    is_male: Optional[bool] = None

class MbtiRequest(BaseModel):
    mbti_type: str
    lang: str = "en"

class ProfileContextRequest(BaseModel):
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
        dayun = None
        if req.is_male is not None:
            dayun = calculate_dayun(req.year, req.month, req.day, req.is_male)
        return {"bazi": result, "analysis": analysis, "dayun": dayun}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mbti/profile")
def mbti_profile(req: MbtiRequest):
    try:
        return get_mbti_profile(req.mbti_type, req.lang)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/profile/combined-context")
def combined_context(req: ProfileContextRequest):
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

from app.mbti_questionnaire import get_questions, calculate_mbti

class QuestionnaireRequest(BaseModel):
    lang: str = "en"

class AnswerRequest(BaseModel):
    answers: dict
    lang: str = "en"

class TimezoneRequest(BaseModel):
    lat: float
    lng: float

@app.post("/timezone/lookup")
def timezone_lookup(req: TimezoneRequest):
    tz = _tf.timezone_at(lat=req.lat, lng=req.lng)
    if not tz:
        raise HTTPException(status_code=404, detail="Timezone not found for given coordinates")
    return {"timezone": tz}

@app.get("/mbti/questions")
def mbti_questions(lang: str = "en"):
    return {"questions": get_questions(lang)}

@app.post("/mbti/calculate")
def mbti_calculate(req: AnswerRequest):
    try:
        answers = {int(k): v for k, v in req.answers.items()}
        result = calculate_mbti(answers)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
