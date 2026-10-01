import sys
from types import ModuleType

# Service tests must not create a real Atlas client or touch development data.
mongodb_module = ModuleType("database.mongodb")
mongodb_module.database = {}
sys.modules["database.mongodb"] = mongodb_module
