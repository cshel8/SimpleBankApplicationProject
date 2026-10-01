from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    account_type: Literal["checking", "savings"] = "checking"
    opening_balance: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)


class AccountUpdate(BaseModel):
    account_type: Literal["checking", "savings"] | None = None


class Account(BaseModel):
    id: str
    customer_id: str
    account_type: Literal["checking", "savings"]
    balance: Decimal
    created_at: datetime | None = None


class MoneyAmount(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class TransferCreate(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class TransferResult(BaseModel):
    from_account: Account
    to_account: Account
