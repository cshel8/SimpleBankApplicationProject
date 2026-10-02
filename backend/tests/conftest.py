import os
import secrets
import sys
from types import ModuleType

# JWT configuration for isolated authentication tests; no development secrets are used.
os.environ.setdefault("JWT_SECRET_KEY", secrets.token_urlsafe(32))
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")

# Tests must not create a real Atlas client or touch development data.
class FakeDatabase(dict):
    def __missing__(self, collection_name):
        collection = object()
        self[collection_name] = collection
        return collection


mongodb_module = ModuleType("database.mongodb")
mongodb_module.database = FakeDatabase()
sys.modules["database.mongodb"] = mongodb_module
