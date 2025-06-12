# backend/db_mysql.py
import mysql.connector
from datetime import datetime

def guardar_deteccion_mysql(url, resultado, probabilidad, tiempo_ms):
    try:
        conn = mysql.connector.connect(
            host="mysql-railway.internal",       # ⚠️ HOST de Railway
            user="root",                         # ⚠️ Usuario de Railway
            password="msBquYSEmjeIoGWnSVldESZRakntFwrK",  # ⚠️ Contraseña real (visible en Railway)
            database="railway",                  # ⚠️ Nombre de tu base de datos
            port=3306                            # ⚠️ Puerto (generalmente 3306)
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
