from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.review_controller import router as review_router

app = FastAPI(title="Rua Segura API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)

@app.get("/")
def read_root():
    return {"status": "Rua Segura API rodando com sucesso!"}