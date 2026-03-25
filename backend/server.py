from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, StrictStr
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
from auth import router as auth_router
from dependencies import get_current_username
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import client, db

app = FastAPI()

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;"
    return response

api_router = APIRouter(prefix="/api")

# Define MongoDB collections
users_collection = db["users"]
consumption_collection = db["consumption"]
goals_collection = db["goals"]
settings_collection = db["settings"]

# Leaderboard Cache
leaderboard_cache = {
    "data": None,
    "last_updated": None
}

PROTECTED_IPS = ["192.168.1.51", "127.0.0.1", "localhost", "::1"]

# Define Models
class BluntItem(BaseModel):
    id: StrictStr = Field(..., max_length=50)
    spot: Optional[StrictStr] = Field(None, max_length=100)
    timestamp: Optional[StrictStr] = Field(None, max_length=50)
    price: Optional[float] = 0.0
    weight: Optional[float] = 0.0
    participants: Optional[int] = 1

class ConsumptionData(BaseModel):
    date: StrictStr = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # Formato YYYY-MM-DD
    blunts: List[BluntItem]
    totalBlunts: int = Field(..., ge=0)
    username: StrictStr = Field(..., max_length=50)
    spam_trigger: Optional[bool] = False

class Goals(BaseModel):
    enableDailyLimit: bool
    dailyLimit: float = Field(..., ge=0)
    limitType: StrictStr = Field(..., max_length=20)
    enableNotifications: bool

class Settings(BaseModel):
    theme: StrictStr = Field(..., max_length=20)
    currency: StrictStr = Field(..., max_length=10)
    # PartyMeter Profile
    partyMeterSex: Optional[StrictStr] = Field(None, max_length=10)
    partyMeterWeight: Optional[StrictStr] = Field(None, max_length=10)
    darkModeContrast: StrictStr = Field(..., max_length=20)
    animationIntensity: StrictStr = Field(..., max_length=20)
    reducedMotion: bool
    autoRefresh: bool
    showAdvancedStats: bool

# Routes for Monster Tracker
@api_router.get("/consumption", response_model=List[ConsumptionData])
async def get_consumption_data(username: str = Depends(get_current_username)):
    try:
        return [ConsumptionData(**item) for item in data]
    except Exception as e:
        logging.error(f"Error fetching consumption data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching data")

from fastapi import Request

@api_router.post("/consumption", response_model=ConsumptionData)
async def add_consumption(data: ConsumptionData, request: Request, username: str = Depends(get_current_username)):
    global leaderboard_cache
    
    forwarded_for = request.headers.get("X-Forwarded-For")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host
    is_protected_ip = client_ip in PROTECTED_IPS
    is_developer = (username == "diego")
    
    # Check block status [DISABLED]
    # db_user = await users_collection.find_one({"username": username})
    # if db_user and db_user.get("ban_until"):
    #     ban_until = db_user.get("ban_until")
    #     if isinstance(ban_until, str):
    #         ban_until = datetime.fromisoformat(ban_until)
    #     if datetime.utcnow() < ban_until and not is_developer:
    #         raise HTTPException(status_code=403, detail={"message": "Tu cuenta está temporal o permanentemente suspendida.", "ban_until": ban_until.isoformat()})

    # Spam Detection [DISABLED]
    # is_spam = getattr(data, 'spam_trigger', False)

    # if is_spam:
    #     anti_cheat_mode = os.environ.get("ANTI_CHEAT_MODE", "live").lower()
    #     ban_time = datetime.utcnow() + timedelta(hours=12)
        
    #     # Erase the fraudulent consumption day entirely from MongoDB
    #     try:
    #         await consumption_collection.delete_one({"date": data.date, "username": username})
    #         leaderboard_cache["data"] = None
    #         leaderboard_cache["last_updated"] = None
    #         print(f"[Anti-Cheat] Borrado día fraudulento {data.date} para usuario {username}")
    #     except Exception as e:
    #         logging.error(f"Error erasing fraudulent consumption: {str(e)}")

    #     if anti_cheat_mode == "live" and not is_protected_ip and not is_developer:
    #         await users_collection.update_one(
    #             {"username": username},
    #             {"$set": {"ban_until": ban_time.isoformat()}}
    #         )
        
    #     raise HTTPException(status_code=429, detail={"message": "too_many_requests_ban", "ban_until": ban_time.isoformat()})

    try:
        # LOG: Mostrar los datos recibidos y el usuario
        print("[POST /consumption] Data recibida:", data.dict())
        print("[POST /consumption] Username extraído:", username)
        # Always save with the correct username
        data_dict = data.dict()
        data_dict["username"] = username
        print("[POST /consumption] Data a guardar:", data_dict)
        existing = await consumption_collection.find_one({"date": data.date, "username": username})
        if existing:
            print("[POST /consumption] Actualizando consumo existente para este usuario y fecha")
            await consumption_collection.update_one(
                {"date": data.date, "username": username},
                {"$set": data_dict}
            )
        else:
            print("[POST /consumption] Insertando nuevo consumo para este usuario y fecha")
            await consumption_collection.insert_one(data_dict)
            
        # Invalidate Cache
        leaderboard_cache["data"] = None
        leaderboard_cache["last_updated"] = None
        
        return ConsumptionData(**data_dict)
    except Exception as e:
        logging.error(f"Error saving consumption data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving data")

class RotationData(BaseModel):
    usernames: List[StrictStr]
    spot: Optional[StrictStr] = None
    bluntType: StrictStr = "Standard"
    weight: float = 0.35
    payingUsers: List[StrictStr] = []

@api_router.post("/rotation")
async def add_rotation(data: RotationData, request: Request, username: str = Depends(get_current_username)):
    global leaderboard_cache
    
    forwarded_for = request.headers.get("X-Forwarded-For")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else request.client.host
    
    # Ensure current user is in the list
    users_to_update = data.usernames
    if username not in users_to_update:
        users_to_update.append(username)
        
    # Calculate costs
    total_cost = data.weight * 5.0
    # Filter paying users to only those in the rotation
    actual_payers = [u for u in data.payingUsers if u in users_to_update]
    
    cost_per_payer = 0.0
    if actual_payers:
        cost_per_payer = total_cost / len(actual_payers)

    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    timestamp_str = datetime.utcnow().isoformat()
    
    try:
        for user in users_to_update:
            user_price = cost_per_payer if user in actual_payers else 0.0
            
            blunt_item = {
                "id": data.bluntType,
                "spot": data.spot,
                "timestamp": timestamp_str,
                "price": user_price,
                "weight": data.weight,
                "participants": len(users_to_update)
            }

            existing = await consumption_collection.find_one({"date": date_str, "username": user})
            if existing:
                await consumption_collection.update_one(
                    {"date": date_str, "username": user},
                    {
                        "$push": {"blunts": blunt_item},
                        "$inc": {"totalBlunts": 1}
                    }
                )
            else:
                new_consumption = {
                    "date": date_str,
                    "blunts": [blunt_item],
                    "totalBlunts": 1,
                    "username": user,
                    "spam_trigger": False
                }
                await consumption_collection.insert_one(new_consumption)
                
        # Invalidate Cache
        leaderboard_cache["data"] = None
        leaderboard_cache["last_updated"] = None
        
        return {
            "status": "success", 
            "message": f"Rotation added for {len(users_to_update)} users",
            "cost_per_payer": cost_per_payer,
            "total_cost": total_cost
        }
        
        return {"status": "success", "message": f"Rotation added for {len(users_to_update)} users"}
    except Exception as e:
        logging.error(f"Error saving rotation data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving data")

@api_router.delete("/consumption/{date}")
async def delete_consumption(date: str, username: str = Depends(get_current_username)):
    global leaderboard_cache
    try:
        print(f"[DELETE /consumption/{date}] Petición recibida para usuario: {username}")
        result = await consumption_collection.delete_one({"date": date, "username": username})
        if result.deleted_count == 0:
            print(f"[DELETE /consumption/{date}] No se encontró registro para borrar")
        else:
            print(f"[DELETE /consumption/{date}] Registro borrado exitosamente")
            # Invalidate Cache only if something was actually deleted
            leaderboard_cache["data"] = None
            leaderboard_cache["last_updated"] = None
            
        return {"status": "success", "message": "Consumption deleted"}
    except Exception as e:
        logging.error(f"Error deleting consumption data: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting data")

@api_router.get("/goals", response_model=Goals)
async def get_goals(username: str = Depends(get_current_username)):
    try:
        goals = await goals_collection.find_one({"username": username})
        if not goals:
            # Return default goals if none exist
            default_goals = Goals(
                enableDailyLimit=True,
                dailyLimit=400,
                limitType="daily",
                enableNotifications=True
            )
            goals_dict = default_goals.dict()
            goals_dict["username"] = username
            await goals_collection.insert_one(goals_dict)
            return default_goals
        return Goals(**goals)
    except Exception as e:
        logging.error(f"Error fetching goals: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching goals")

@api_router.put("/goals", response_model=Goals)
async def update_goals(goals: Goals, username: str = Depends(get_current_username)):
    try:
        goals_dict = goals.dict()
        goals_dict["username"] = username
        await goals_collection.update_one(
            {"username": username},
            {"$set": goals_dict},
            upsert=True
        )
        return goals
    except Exception as e:
        logging.error(f"Error updating goals: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating goals")

@api_router.get("/settings", response_model=Settings)
async def get_settings(username: str = Depends(get_current_username)):
    try:
        settings = await settings_collection.find_one({"username": username})
        if not settings:
            # Return default settings if none exist
            default_settings = Settings(
                darkModeContrast="normal",
                animationIntensity="normal",
                reducedMotion=False,
                autoRefresh=True,
                showAdvancedStats=True
            )
            settings_dict = default_settings.dict()
            settings_dict["username"] = username
            await settings_collection.insert_one(settings_dict)
            return default_settings
        return Settings(**settings)
    except Exception as e:
        logging.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching settings")

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings: Settings, username: str = Depends(get_current_username)):
    try:
        settings_dict = settings.dict()
        settings_dict["username"] = username
        await settings_collection.update_one(
            {"username": username},
            {"$set": settings_dict},
            upsert=True
        )
        return settings
    except Exception as e:
        logging.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating settings")

# RUTA DE LEADERBOARD RANKEDS
@api_router.get("/leaderboard")
async def get_leaderboard():
    global leaderboard_cache
    
    # Check if cache has data
    today_str = datetime.now().strftime("%Y-%m-%d")
    # Disable cache to ensure live data in production
    # if leaderboard_cache["data"] is not None:
    #     return leaderboard_cache["data"]
        
    try:
        now_str = datetime.utcnow().isoformat()
        banned_users_cursor = await users_collection.find({"ban_until": {"$gt": now_str}}).to_list(1000)
        excluded_usernames = ["diego"] + [u.get("username") for u in banned_users_cursor if u.get("username")]

        pipeline = [
            {"$match": {"username": {"$nin": excluded_usernames}}},
            {"$group": {
                "_id": "$username",
                "totalBlunts": {"$sum": {"$toInt": {"$ifNull": ["$totalBlunts", 0]}}},
                "allBluntsArrays": {"$push": "$blunts"}
            }},
            {"$unwind": "$allBluntsArrays"},
            {"$unwind": "$allBluntsArrays"},
            {"$group": {
                "_id": {
                    "username": "$_id",
                    "spot": "$allBluntsArrays.spot"
                },
                "bluntCount": {"$sum": 1},
                "totalBlunts": {"$first": "$totalBlunts"},
                "spotSpent": {"$sum": {"$toDouble": {"$ifNull": ["$allBluntsArrays.price", 0]}}}
            }},
            {"$sort": {"bluntCount": -1}},
            {"$group": {
                "_id": "$_id.username",
                "totalBluntsCount": {"$sum": "$bluntCount"},
                "topSpot": {"$first": "$_id.spot"},
                "totalBlunts": {"$first": "$totalBlunts"},
                "totalSpent": {"$sum": "$spotSpent"}
            }},
            {"$project": {
                "username": "$_id",
                "totalBluntsCount": 1,
                "topSpot": 1,
                "totalBlunts": 1,
                "totalSpent": 1,
                "_id": 0
            }},
            {"$sort": {
                "totalBluntsCount": -1
            }}
        ]
        
        cursor = consumption_collection.aggregate(pipeline)
        leaderboard_data = await cursor.to_list(length=100)
        
        # Calculate streaks
        dates_pipeline = [
            {"$match": {"username": {"$nin": excluded_usernames}}},
            {"$group": {
                "_id": "$username",
                "dates": {"$push": "$date"}
            }}
        ]
        dates_cursor = consumption_collection.aggregate(dates_pipeline)
        dates_data = await dates_cursor.to_list(length=100)
        
        user_streaks = {}
        user_streaks = {}
        for user_dates in dates_data:
            username = user_dates["_id"]
            try:
                dates = sorted([datetime.strptime(d, "%Y-%m-%d") for d in set(user_dates.get("dates", []))])
            except:
                dates = []
                
            max_streak = 0
            current_streak = 0
            for i in range(len(dates)):
                if i == 0:
                    current_streak = 1
                else:
                    diff = (dates[i] - dates[i-1]).days
                    if diff == 1:
                        current_streak += 1
                    elif diff > 1:
                        current_streak = 1
                if current_streak > max_streak:
                    max_streak = current_streak
            
            active_current_streak = 0
            total_weeks = 1.0
            if dates:
                today = datetime.now()
                first_day = dates[0]
                days_diff = (today - first_day).days
                total_weeks = max(1.0, days_diff / 7.0)
                
                today_date = today.date()
                days_since_last = (today_date - dates[-1].date()).days
                if days_since_last <= 1:
                    active_current_streak = current_streak
                    
            user_streaks[username] = {
                "max": max_streak, 
                "current": active_current_streak, 
                "activeDays": len(dates),
                "totalWeeks": total_weeks
            }
            
        # Merge maxStreak and currentStreak into leaderboard data and assign random tiebreaker
        for user in leaderboard_data:
            streaks = user_streaks.get(user.get("username"), {"max": 0, "current": 0, "activeDays": 1, "totalWeeks": 1.0})
            user["maxStreak"] = streaks.get("max", 0)
            user["currentStreak"] = streaks.get("current", 0)
            user["activeDays"] = streaks.get("activeDays", 1)
            user["totalWeeks"] = streaks.get("totalWeeks", 1.0)
            user["_random_tiebreaker"] = random.random()
            
        # Final Python Sort: totalBluntsP(desc), maxStreak(desc), random(desc)
        leaderboard_data.sort(key=lambda x: (
            x.get("totalBluntsCount", 0),
            x.get("maxStreak", 0),
            x.get("_random_tiebreaker", 0)
        ), reverse=True)
        
        # Cleanup
        for user in leaderboard_data:
            user.pop("_random_tiebreaker", None)
            
        # Optional Request User's Top Rotation Buddies
        # To avoid massive N^2 calculations for everyone, we'll calculate rotation buddies globally
        # By grouping blunts with the exact same timestamp.
        all_rotations_pipeline = [
            {"$unwind": "$blunts"},
            {"$match": {"blunts.timestamp": {"$ne": None}, "username": {"$nin": excluded_usernames}}},
            {"$group": {
                "_id": "$blunts.timestamp",
                "users": {"$push": "$username"}
            }}
        ]
        all_rotations_cursor = consumption_collection.aggregate(all_rotations_pipeline)
        all_rotations = await all_rotations_cursor.to_list(length=None)
        
        # Build a frequency map of buddies for each user
        buddy_freq = {}
        for rotation in all_rotations:
            users_in_rotation = rotation.get("users", [])
            if len(users_in_rotation) > 1: # It's a group session
                for u1 in users_in_rotation:
                    if u1 not in buddy_freq:
                        buddy_freq[u1] = {}
                    for u2 in users_in_rotation:
                        if u1 != u2:
                            buddy_freq[u1][u2] = buddy_freq[u1].get(u2, 0) + 1
                            
        # Attach top 3 buddies to each user in leaderboard
        for user in leaderboard_data:
            uname = user.get("username")
            if uname in buddy_freq:
                # Sort buddies by count
                sorted_buddies = sorted(buddy_freq[uname].items(), key=lambda item: item[1], reverse=True)
                # Take top 3
                user["topBuddies"] = [{"username": b[0], "sessions": b[1]} for b in sorted_buddies[:3]]
            else:
                user["topBuddies"] = []

        # Optional Achievements calculation for Top 3
        try:
            top_3_usernames = [u.get("username") for u in leaderboard_data[:3]]
            if top_3_usernames:
                blunts_cursor = consumption_collection.aggregate([
                    {"$match": {"username": {"$in": top_3_usernames}}},
                    {"$unwind": "$blunts"},
                    {"$project": {"username": 1, "blunt": "$blunts", "_id": 0}}
                ])
                top_3_blunts = await blunts_cursor.to_list(length=None)
                
                stats = {u: {"freeloader": 0, "night": 0, "morning": 0, "sponsor": 0, "solo": 0, "large": 0, "fatty": 0, "unique_spots": set(), "daily_counts": {}, "total_weight": 0.0} for u in top_3_usernames}
                
                for item in top_3_blunts:
                    uname = item.get("username")
                    if not uname or uname not in stats: continue
                    blunt = item.get("blunt", {})
                    st = stats[uname]
                    
                    if blunt.get("payer") and blunt.get("payer") != uname:
                        st["freeloader"] += 1
                    if blunt.get("price", 0) > 0:
                        st["sponsor"] += 1
                    if blunt.get("participants", 0) == 1:
                        st["solo"] += 1
                    if blunt.get("participants", 0) >= 7:
                        st["large"] += 1
                    if blunt.get("weight", 0) >= 1.5:
                        st["fatty"] += 1
                    if blunt.get("weight", 0):
                        st["total_weight"] += float(blunt.get("weight"))
                    if blunt.get("spot"):
                        st["unique_spots"].add(blunt.get("spot").strip().lower())
                        
                    ts = blunt.get("timestamp")
                    day_key = None
                    if ts:
                        try:
                            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                            h = dt.hour
                            if 0 <= h < 5:
                                st["night"] += 1
                            elif 5 <= h < 11:
                                st["morning"] += 1
                            day_key = dt.strftime("%Y-%m-%d")
                        except:
                            pass
                    if not day_key:
                        day_key = blunt.get("date", "unknown")
                    st["daily_counts"][day_key] = st["daily_counts"].get(day_key, 0) + 1
                    
                for u in leaderboard_data[:3]:
                    uname = u.get("username")
                    st = stats.get(uname, {})
                    daily_max = max(st.get("daily_counts").values()) if st.get("daily_counts") else 0
                    
                    medals = []
                    if st.get("freeloader", 0) >= 10:
                        medals.append({"id": "el_junador", "icon": "🪳", "name": "El Mayor Junador", "priority": 1})
                    if st.get("solo", 0) >= 20:
                        medals.append({"id": "lone_wolf", "icon": "🎧", "name": "Autista Empedernido", "priority": 2})
                    if st.get("large", 0) >= 1:
                        medals.append({"id": "shaman", "icon": "🧙‍♂️", "name": "El Chamán", "priority": 3})
                    if st.get("fatty", 0) >= 1:
                        medals.append({"id": "fat_blunt", "icon": "🪵", "name": "El Gordo", "priority": 4})
                    if len(st.get("unique_spots", set())) >= 5:
                        medals.append({"id": "explorer", "icon": "🗺️", "name": "Explorer", "priority": 5})
                    if daily_max >= 5:
                        medals.append({"id": "chimney", "icon": "🏭", "name": "La Chimenea", "priority": 6})
                    if st.get("total_weight", 0) >= 10:
                        medals.append({"id": "heavyweight", "icon": "🏋️‍♂️", "name": "Heavyweight", "priority": 7})
                    if st.get("night", 0) >= 5:
                        medals.append({"id": "night_owl", "icon": "🦉", "name": "Buenas Noches", "priority": 8})
                    if st.get("morning", 0) >= 5:
                        medals.append({"id": "early_bird", "icon": "🌅", "name": "Buenos Días", "priority": 9})
                    if u.get("maxStreak", 0) >= 5:
                        medals.append({"id": "iron_lungs", "icon": "🫁", "name": "Inhalador de Alquitrán", "priority": 10})
                    if st.get("sponsor", 0) >= 20:
                        medals.append({"id": "sugar_daddy", "icon": "💸", "name": "Sugar Daddy", "priority": 11})
                    if u.get("totalBluntsCount", 0) >= 100:
                        medals.append({"id": "veteran", "icon": "🎖️", "name": "Veteran Smoker", "priority": 12})
                        
                    medals.sort(key=lambda x: x["priority"])
                    u["optional_achievements"] = medals
        except Exception as e:
            logging.error(f"Error calculating medals: {str(e)}")
        leaderboard_cache["data"] = leaderboard_data
        leaderboard_cache["last_updated"] = today_str
        
        return leaderboard_data
        
    except Exception as e:
        logging.error(f"Error generating leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating leaderboard")

@api_router.get("/spots/search")
async def search_spots(query: Optional[str] = None):
    try:
        pipeline = [
            {"$unwind": "$blunts"},
            {"$match": {"blunts.spot": {"$type": "string", "$ne": ""}}}
        ]
        
        if query and len(query.strip()) > 0:
            query_escaped = query.strip()
            pipeline.append({"$match": {"blunts.spot": {"$regex": f"{query_escaped}", "$options": "i"}}})
            
        pipeline.extend([
            {"$group": {
                "_id": {"$toLower": "$blunts.spot"},
                "originalSpot": {"$first": "$blunts.spot"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 6},
            {"$project": {"spot": "$originalSpot", "_id": 0}}
        ])
        
        cursor = consumption_collection.aggregate(pipeline)
        spots_data = await cursor.to_list(length=8)
        return [s["spot"] for s in spots_data]
    except Exception as e:
        logging.error(f"Error searching spots: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching spots")

@api_router.get("/users/search")
async def search_users(
    query: Optional[str] = None, 
    exclude: Optional[List[str]] = Query(None),
    current_user: str = Depends(get_current_username)
):
    try:
        excluded_list = [current_user, "diego"]
        if exclude:
            excluded_list.extend(exclude)
            
        if not query or len(query.strip()) < 1:
            # Return 3 random users not in the excluded list
            pipeline = [
                {"$match": {"username": {"$nin": excluded_list}}},
                {"$sample": {"size": 3}},
                {"$project": {"username": 1, "_id": 0}}
            ]
            cursor = users_collection.aggregate(pipeline)
            users = await cursor.to_list(length=3)
            return [user["username"] for user in users]
            
        cursor = users_collection.find(
            {
                "username": {
                    "$regex": f"^{query}", 
                    "$options": "i", 
                    "$nin": excluded_list
                }
            },
            {"username": 1, "_id": 0}
        ).limit(10)
        
        users = await cursor.to_list(length=10)
        return [user["username"] for user in users]
    except Exception as e:
        logging.error(f"Error searching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching users")

# Include the router
app.include_router(api_router)
app.include_router(auth_router)

# CORS middleware
frontend_url = os.environ.get("FRONTEND_URL")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

from fastapi.responses import FileResponse

# Serve static files and SPA fallback
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Attempt to find the file in the React build folder
    build_dir = ROOT_DIR.parent / "build"
    file_path = build_dir / full_path

    # If it's a direct request to a file (like CSS, JS, images)
    if file_path.is_file():
        return FileResponse(file_path)
    
    # Fallback to index.html for React Router
    index_path = build_dir / "index.html"
    if index_path.is_file():
        return FileResponse(index_path)
        
    raise HTTPException(status_code=404, detail="File not found")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()