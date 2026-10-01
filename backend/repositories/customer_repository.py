import re
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from database.mongodb import database
from models.customer import Customer


class CustomerRepository:
    def __init__(self):
        self.collection = database["customers"]

    def get_all_customers(self) -> list[Customer]:
        return [self._to_customer(customer) for customer in self.collection.find({})]

    def search_customers(self, query: str) -> list[Customer]:
        escaped_query = re.escape(query)
        return [
            self._to_customer(customer)
            for customer in self.collection.find({
                "$or": [
                    {"name": {"$regex": escaped_query, "$options": "i"}},
                    {"username": {"$regex": escaped_query, "$options": "i"}},
                ]
            })
        ]

    def create_customer(
        self,
        name: str,
        username: str,
        password_hash: str
    ) -> Customer:
        created_at = datetime.now(timezone.utc)
        result = self.collection.insert_one({
            "name": name,
            "username": username,
            "password_hash": password_hash,
            "created_at": created_at,
        })

        return Customer(
            id=str(result.inserted_id),
            name=name,
            username=username,
            created_at=created_at,
        )

    def get_customer_by_id(self, customer_id: str) -> Customer | None:
        object_id = self._to_object_id(customer_id)
        if object_id is None:
            return None
        customer = self.collection.find_one({"_id": object_id})
        return self._to_customer(customer) if customer is not None else None

    def get_customer_by_username(self, username: str) -> Customer | None:
        customer = self.collection.find_one({"username": username})
        return self._to_customer(customer) if customer is not None else None

    def update_customer(
        self,
        customer_id: str,
        name: str,
        username: str
    ) -> Customer | None:
        object_id = self._to_object_id(customer_id)
        if object_id is None:
            return None
        customer = self.collection.find_one_and_update(
            {"_id": object_id},
            {"$set": {"name": name, "username": username}},
            return_document=ReturnDocument.AFTER,
        )
        return self._to_customer(customer) if customer is not None else None

    def delete_customer(self, customer_id: str) -> bool:
        object_id = self._to_object_id(customer_id)
        if object_id is None:
            return False
        return self.collection.delete_one({"_id": object_id}).deleted_count == 1

    @staticmethod
    def _to_object_id(customer_id: str) -> ObjectId | None:
        try:
            return ObjectId(customer_id)
        except (InvalidId, TypeError):
            return None

    @staticmethod
    def _to_customer(customer: dict) -> Customer:
        return Customer(
            id=str(customer["_id"]),
            name=customer["name"],
            username=customer["username"],
            created_at=CustomerRepository._to_utc(customer.get("created_at")),
        )

    @staticmethod
    def _to_utc(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
