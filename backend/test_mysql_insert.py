# test_connection.py
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

print("DEBUG >> Host:", os.getenv("MYSQL_HOST"))
print("DEBUG >> Port:", os.getenv("MYSQL_PORT"))
print("DEBUG >> User:", os.getenv("MYSQL_USER"))
print("DEBUG >> Password:", os.getenv("MYSQL_PASSWORD")[:5], "***")  # solo los primeros caracteres
print("DEBUG >> DB:", os.getenv("MYSQL_DB"))


try:
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB")
    )
    print("✅ Conexión exitosa")
    conn.close()
except Exception as e:
    print("❌ ERROR de conexión:", e)
