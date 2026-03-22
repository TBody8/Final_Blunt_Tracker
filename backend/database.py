import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import traceback
import sys

def get_database():
    try:
        mongo_url = os.getenv('MONGO_URI')
        db_name = os.getenv('MONGO_DB_NAME', 'monstertracker')
        
        if not mongo_url:
            raise ValueError("MONGO_URI environment variable is not set or empty.")
        if not db_name:
            raise ValueError("MONGO_DB_NAME environment variable is not set or empty.")
            
        print(f"Initializing MongoDB Client (URI: {mongo_url[:20]}..., DB: {db_name})")
        
        # Adding timeouts to prevent hangs
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        return client, client[db_name]

    except Exception as e:
        print("Error in get_database:")
        traceback.print_exc()
        sys.exit(1)

# Global instances
try:
    client, db = get_database()
except Exception as e:
    print("Error initializing globals:")
    traceback.print_exc()
    sys.exit(1)
