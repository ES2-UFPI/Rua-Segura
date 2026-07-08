from dotenv import load_dotenv
import os
import glob
import firebase_admin
from firebase_admin import credentials

load_dotenv()

# Inicializa o Firebase Admin SDK
try:
    # Procura por qualquer arquivo contendo 'firebase' e terminando com '.json' na raiz do backend
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    firebase_keys = glob.glob(os.path.join(backend_dir, "*firebase*.json"))
    
    if firebase_keys:
        cred = credentials.Certificate(firebase_keys[0])
        firebase_admin.initialize_app(cred)
        print(f"[Firebase] Inicializado com sucesso usando o arquivo: {os.path.basename(firebase_keys[0])}")
    else:
        # Tenta inicialização padrão (caso use variáveis de ambiente como GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app()
        print("[Firebase] Inicializado usando as credenciais padrão do ambiente.")
except Exception as e:
    print(f"[Firebase] Aviso: Não foi possível inicializar o Firebase Admin SDK ({e}). "
          f"Para habilitar notificações, adicione o arquivo JSON de chaves privadas obtido no Console do Firebase "
          f"na raiz da pasta 'backend' do projeto.")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.review_controller import router as review_router
from app.controllers.risk_controller import router as risk_router
from app.controllers import alert_controller
from app.controllers.route_controller import router as route_router
from app.controllers.mock_sharing_controller import router as mock_sharing_router
from app.controllers.mock_occurrence_controller import router as mock_occurrence_router
from app.controllers.notification_controller import router as notification_router

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
app.include_router(notification_router)

@app.get("/")
def read_root():
    return {"status": "Rua Segura API rodando com sucesso!"}
