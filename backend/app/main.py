from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.review_controller import router as review_router
from app.controllers.risk_controller import router as risk_router
from app.controllers import alert_controller
from app.controllers.route_controller import router as route_router
from app.controllers.mock_sharing_controller import router as mock_sharing_router
from app.controllers.mock_occurrence_controller import router as mock_occurrence_router

app = FastAPI(title="Rua Segura API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)
app.include_router(risk_router)
app.include_router(alert_controller.router)
app.include_router(route_router)
app.include_router(mock_sharing_router)
app.include_router(mock_occurrence_router)

@app.get("/")
def read_root():
    return {"status": "Rua Segura API rodando com sucesso!"}
