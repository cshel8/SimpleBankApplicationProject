from fastapi import FastAPI
from controllers.customer_controller import router as customer_router

app = FastAPI()

app.include_router( customer_router )

@app.get("/")
def root():
    return {"message": "Bank API is running!"}