import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from controllers.customer_controller import router as customer_router
from controllers.account_controller import router as account_router
from controllers.audit_controller import router as audit_router
from controllers.auth_controller import router as auth_router
from controllers.self_service_controller import router as self_service_router

app = FastAPI(title="Simple Bank API", description="A student banking REST API using MongoDB Atlas.")

allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
deployed_frontend_origin = os.getenv("DEPLOYED_FRONTEND_ORIGIN")
if deployed_frontend_origin:
    allowed_origins.append(deployed_frontend_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router( customer_router )
app.include_router(account_router)
app.include_router(audit_router)
app.include_router(auth_router)
app.include_router(self_service_router)

@app.get("/")
def root():
    return {"message": "Bank API is running!"}


handler = Mangum(app)
