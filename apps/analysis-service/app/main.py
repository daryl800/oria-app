from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.bazi import calculate_bazi, enrich_with_localized_pillars, analyze_three_pillars

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
