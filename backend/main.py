from fastapi import FastAPI
from controllers.customer_controller import router as customer_router
from controllers.account_controller import router as account_router
from controllers.audit_controller import router as audit_router

app = FastAPI(title="Simple Bank API", description="A student banking REST API using an in-memory data source.")

app.include_router( customer_router )
app.include_router(account_router)
app.include_router(audit_router)

@app.get("/")
def root():
    return {"message": "Bank API is running!"}
