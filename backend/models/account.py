from decimal import Decimal

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    account_type: str = Field(default="checking", min_length=1, max_length=30)
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)


class AccountUpdate(BaseModel):
    account_type: str | None = Field(default=None, min_length=1, max_length=30)


class Account(BaseModel):
    id: int
    customer_id: int
    account_type: str
    balance: Decimal


class MoneyAmount(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
