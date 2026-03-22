import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Use the same logic as database.py
def get_db_info():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    mongo_url = os.getenv('MONGO_URI')
    db_name = os.getenv('MONGO_DB_NAME', 'monstertracker')
    return mongo_url, db_name

async def clear_bans():
    mongo_url, db_name = get_db_info()
    if not mongo_url:
        print("MONGO_URI not found!")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connecting to MongoDB (DB: {db_name})...")
    
    # 1. Clear banned_ips
    result = await db["banned_ips"].delete_many({})
    print(f"Cleared {result.deleted_count} IPs from banned_ips.")
    
    # 2. Reset ban_until in users
    result = await db["users"].update_many(
        {"ban_until": {"$exists": True}},
        {"$unset": {"ban_until": ""}}
    )
    print(f"Reset ban_until for {result.modified_count} users.")
    
    client.close()
    print("Done.")

if __name__ == "__main__":
    asyncio.run(clear_bans())
