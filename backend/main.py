from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.customer_controller import router as customer_router
from controllers.account_controller import router as account_router
from controllers.audit_controller import router as audit_router

app = FastAPI(title="Simple Bank API", description="A student banking REST API using MongoDB Atlas.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router( customer_router )
app.include_router(account_router)
app.include_router(audit_router)

@app.get("/")
def root():
    return {"message": "Bank API is running!"}
