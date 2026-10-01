from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class AuditRecord(BaseModel):
    id: str
    action_type: Literal["deposit", "withdrawal", "transfer"]
    customer_id: str | None = None
    from_account_id: str | None = None
    to_account_id: str | None = None
    amount: Decimal
    timestamp: datetime
