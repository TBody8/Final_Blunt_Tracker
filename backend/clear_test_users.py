import asyncio
from database import db

async def clear_tests():
    print("Conectando a la base de datos...")
    query = {"username": {"$regex": "test|friend", "$options": "i"}}
    
    users_cursor = db.users.find(query)
    users_to_delete = await users_cursor.to_list(length=100)
    user_ids = [u["_id"] for u in users_to_delete]
    usernames = [u["username"] for u in users_to_delete]
    
    print(f"Usuarios de prueba a eliminar ({len(user_ids)}): {usernames}")
    
    if user_ids:
        # Delete users
        res1 = await db.users.delete_many({"_id": {"$in": user_ids}})
        print(f"Borrados {res1.deleted_count} usuarios.")
        
        # Delete sessions owned by them
        res2 = await db.sessions.delete_many({"userId": {"$in": user_ids}})
        print(f"Borradas {res2.deleted_count} sesiones.")
        
        # Also clean them from rotations
        res3 = await db.sessions.update_many(
            {"rotationUsers": {"$in": usernames}},
            {"$pull": {"rotationUsers": {"$in": usernames}}}
        )
        print(f"Actualizadas {res3.modified_count} sesiones limpiando su participación en rotaciones.")
    
    print("Done")

if __name__ == "__main__":
    asyncio.run(clear_tests())
