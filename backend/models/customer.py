from pydantic import BaseModel

class CustomerCreate( BaseModel ):
    name: str
    username: str

class Customer(BaseModel):
    id: int
    name: str
    username: str 