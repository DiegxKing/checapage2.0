import os
from dotenv import load_dotenv
import mysql.connector
from datetime import datetime

load_dotenv()

def guardar_deteccion_mysql(url, resultado, probabilidad, tiempo_ms):
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            port=int(os.getenv("MYSQL_PORT")),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DB")
        )

        cursor = conn.cursor()
        now = datetime.now()
        fecha = now.strftime("%Y-%m-%d")
        hora = now.strftime("%H:%M:%S")

        query = """
            INSERT INTO url_maliciosas (url, resultado, probabilidad, fecha, hora, tiempo_ms)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        valores = (url, resultado, probabilidad, fecha, hora, tiempo_ms)
        cursor.execute(query, valores)
        conn.commit()
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[❌ MySQL Error] {e}")
