import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not configured.")

if not MONGODB_DB_NAME:
    raise RuntimeError("MONGODB_DB_NAME is not configured.")

client = MongoClient(MONGODB_URI)
database = client[MONGODB_DB_NAME]