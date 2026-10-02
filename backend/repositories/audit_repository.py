from datetime import datetime, timezone
from decimal import Decimal

from bson import ObjectId
from bson.decimal128 import Decimal128
from bson.errors import InvalidId

from database.mongodb import database
from models.audit import AuditRecord


class AuditRepository:
    def __init__(self):
        self.collection = database["transactions"]

    def get_all_records(self) -> list[AuditRecord]:
        return [
            self._to_audit_record(record)
            for record in self.collection.find({}).sort("timestamp", -1)
        ]

    def get_record_by_id(self, record_id: str) -> AuditRecord | None:
        object_id = self._to_object_id(record_id)
        if object_id is None:
            return None
        record = self.collection.find_one({"_id": object_id})
        return self._to_audit_record(record) if record is not None else None

    def get_records_for_account(self, account_id: str) -> list[AuditRecord]:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return []
        return [
            self._to_audit_record(record)
            for record in self.collection.find({
                "$or": [
                    {"from_account_id": object_id},
                    {"to_account_id": object_id},
                ]
            }).sort("timestamp", -1)
        ]

    def get_records_for_accounts(self, account_ids: list[str]) -> list[AuditRecord]:
        object_ids = [
            object_id
            for account_id in account_ids
            if (object_id := self._to_object_id(account_id)) is not None
        ]
        if not object_ids:
            return []
        return [
            self._to_audit_record(record)
            for record in self.collection.find({
                "$or": [
                    {"from_account_id": {"$in": object_ids}},
                    {"to_account_id": {"$in": object_ids}},
                ]
            }).sort("timestamp", -1)
        ]

    def create_record(
        self,
        action_type: str,
        customer_id: str | None,
        from_account_id: str | None,
        to_account_id: str | None,
        amount: Decimal,
        session=None,
    ) -> AuditRecord:
        timestamp = datetime.now(timezone.utc)
        document = {
            "action_type": action_type,
            "customer_id": self._to_object_id(customer_id) if customer_id else None,
            "from_account_id": self._to_object_id(from_account_id) if from_account_id else None,
            "to_account_id": self._to_object_id(to_account_id) if to_account_id else None,
            "amount": Decimal128(amount),
            "timestamp": timestamp,
        }
        result = self.collection.insert_one(document, session=session)
        document["_id"] = result.inserted_id
        return self._to_audit_record(document)

    @staticmethod
    def _to_object_id(value: str) -> ObjectId | None:
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _to_audit_record(record: dict) -> AuditRecord:
        timestamp = record["timestamp"]
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return AuditRecord(
            id=str(record["_id"]),
            action_type=record["action_type"],
            customer_id=str(record["customer_id"]) if record["customer_id"] else None,
            from_account_id=str(record["from_account_id"]) if record["from_account_id"] else None,
            to_account_id=str(record["to_account_id"]) if record["to_account_id"] else None,
            amount=record["amount"].to_decimal(),
            timestamp=timestamp,
        )
