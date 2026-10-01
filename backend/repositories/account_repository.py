from datetime import datetime, timezone
from decimal import Decimal

from bson import ObjectId
from bson.decimal128 import Decimal128
from bson.errors import InvalidId
from pymongo import ReturnDocument

from database.mongodb import database
from models.account import Account
from repositories.audit_repository import AuditRepository


class _TransactionDocumentNotFound(Exception):
    """Signals that an account transaction must be rolled back."""


class AccountRepository:
    """Data-access operations for the MongoDB accounts collection."""

    def __init__(self):
        self.collection = database["accounts"]

    def get_all_accounts(self) -> list[Account]:
        return [self._to_account(account) for account in self.collection.find({})]

    def get_premium_accounts(self, threshold: Decimal) -> list[Account]:
        return [
            self._to_account(account)
            for account in self.collection.find({"balance": {"$gte": Decimal128(threshold)}})
        ]

    def get_account_by_id(self, account_id: str) -> Account | None:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return None
        account = self.collection.find_one({"_id": object_id})
        return self._to_account(account) if account is not None else None

    def create_account(self, customer_id: str, account_type: str, balance: Decimal) -> Account | None:
        customer_object_id = self._to_object_id(customer_id)
        if customer_object_id is None:
            return None
        created_at = datetime.now(timezone.utc)
        result = self.collection.insert_one({
            "customer_id": customer_object_id,
            "account_type": account_type,
            "balance": Decimal128(balance),
            "created_at": created_at,
        })
        return Account(
            id=str(result.inserted_id),
            customer_id=customer_id,
            account_type=account_type,
            balance=balance,
            created_at=created_at,
        )

    def update_account(self, account_id: str, account_type: str) -> Account | None:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return None
        account = self.collection.find_one_and_update(
            {"_id": object_id},
            {"$set": {"account_type": account_type}},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_account(account) if account is not None else None

    def deposit(
        self,
        account_id: str,
        amount: Decimal,
        audit_repository: AuditRepository,
    ) -> Account | None:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return None
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    account = self.collection.find_one_and_update(
                        {"_id": object_id},
                        {"$inc": {"balance": Decimal128(amount)}},
                        return_document=ReturnDocument.AFTER,
                        session=session,
                    )
                    if account is None:
                        raise _TransactionDocumentNotFound()
                    audit_repository.create_record(
                        action_type="deposit",
                        customer_id=str(account["customer_id"]),
                        from_account_id=None,
                        to_account_id=account_id,
                        amount=amount,
                        session=session,
                    )
        except _TransactionDocumentNotFound:
            return None
        return self._to_account(account)

    def withdraw(
        self,
        account_id: str,
        amount: Decimal,
        audit_repository: AuditRepository,
    ) -> Account | None:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return None
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    account = self.collection.find_one_and_update(
                        {"_id": object_id, "balance": {"$gte": Decimal128(amount)}},
                        {"$inc": {"balance": Decimal128(-amount)}},
                        return_document=ReturnDocument.AFTER,
                        session=session,
                    )
                    if account is None:
                        raise _TransactionDocumentNotFound()
                    audit_repository.create_record(
                        action_type="withdrawal",
                        customer_id=str(account["customer_id"]),
                        from_account_id=account_id,
                        to_account_id=None,
                        amount=amount,
                        session=session,
                    )
        except _TransactionDocumentNotFound:
            return None
        return self._to_account(account)

    def transfer(
        self,
        from_account_id: str,
        to_account_id: str,
        amount: Decimal,
        audit_repository: AuditRepository,
    ) -> tuple[Account, Account] | None:
        from_object_id = self._to_object_id(from_account_id)
        to_object_id = self._to_object_id(to_account_id)
        if from_object_id is None or to_object_id is None:
            return None

        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    source = self.collection.find_one_and_update(
                        {"_id": from_object_id, "balance": {"$gte": Decimal128(amount)}},
                        {"$inc": {"balance": Decimal128(-amount)}},
                        return_document=ReturnDocument.AFTER,
                        session=session,
                    )
                    if source is None:
                        raise _TransactionDocumentNotFound()

                    destination = self.collection.find_one_and_update(
                        {"_id": to_object_id},
                        {"$inc": {"balance": Decimal128(amount)}},
                        return_document=ReturnDocument.AFTER,
                        session=session,
                    )
                    if destination is None:
                        raise _TransactionDocumentNotFound()

                    audit_repository.create_record(
                        action_type="transfer",
                        customer_id=str(source["customer_id"]),
                        from_account_id=from_account_id,
                        to_account_id=to_account_id,
                        amount=amount,
                        session=session,
                    )
        except _TransactionDocumentNotFound:
            return None

        return self._to_account(source), self._to_account(destination)

    def delete_account(self, account_id: str) -> bool:
        object_id = self._to_object_id(account_id)
        if object_id is None:
            return False
        return self.collection.delete_one({"_id": object_id}).deleted_count == 1

    def delete_accounts_for_customer(self, customer_id: str) -> None:
        customer_object_id = self._to_object_id(customer_id)
        if customer_object_id is not None:
            self.collection.delete_many({"customer_id": customer_object_id})

    @staticmethod
    def _to_object_id(value: str) -> ObjectId | None:
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _to_account(account: dict) -> Account:
        balance = account["balance"]
        if isinstance(balance, Decimal128):
            balance = balance.to_decimal()
        else:
            balance = Decimal(str(balance))
        return Account(
            id=str(account["_id"]),
            customer_id=str(account["customer_id"]),
            account_type=account["account_type"],
            balance=balance,
            created_at=AccountRepository._to_utc(account.get("created_at")),
        )

    @staticmethod
    def _to_utc(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
