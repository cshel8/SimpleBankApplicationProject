from pydantic import BaseModel, Field

class CustomerCreate( BaseModel ):
    name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

class Customer(BaseModel):
    id: str
    name: str
    username: str

class CustomerUpdate( BaseModel ):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    username: str | None = Field(default=None, min_length=3, max_length=50)
