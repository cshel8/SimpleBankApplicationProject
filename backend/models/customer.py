from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CustomerRole = Literal["customer", "admin"]

class CustomerCreate( BaseModel ):
    name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

class Customer(BaseModel):
    id: str
    name: str
    username: str
    role: CustomerRole = "customer"
    created_at: datetime | None = None

class CustomerUpdate( BaseModel ):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    username: str | None = Field(default=None, min_length=3, max_length=50)


class CustomerAuthRecord(BaseModel):
    """Internal authentication data; never use as an API response model."""

    id: str
    username: str
    password_hash: str
    role: CustomerRole = "customer"


class RegistrationRequest(CustomerCreate):
    """Public registration input deliberately has no role field."""

    model_config = ConfigDict(extra="forbid")


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class AuthenticatedIdentity(BaseModel):
    id: str
    username: str
    role: CustomerRole
