# backend/db_mysql.py
import mysql.connector
from datetime import datetime

def guardar_deteccion_mysql(url, resultado, probabilidad, tiempo_ms):
    try:
        conn = mysql.connector.connect(
            host="mainline.proxy.rlwy.net",
            user="root",
            password="msBquYSEmjeIoGWnSVldESZRakntFwrK",
            database="railway",
            port=3306
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
