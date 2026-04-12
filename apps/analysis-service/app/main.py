from fastapi import FastAPI

app = FastAPI(title="oria-analysis-service")

@app.get("/health")
def health():
    return {"status": "ok", "service": "oria-analysis-service"}
