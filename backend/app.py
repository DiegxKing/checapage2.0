# ✅ app.py completo con integración a MySQL y modelo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from url_feature_extractor import URLFeatureExtractor
from db_mysql import guardar_deteccion_mysql  # ⚡ Nueva función
import time

# Inicializar app
app = FastAPI()

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar scaler y modelo
scaler = joblib.load("scaler.pkl")
booster = xgb.Booster()
booster.load_model("xgb_model.json")

# Columnas esperadas
FEATURE_COLUMNS = [
    "URLLength", "DomainLength", "TLDLength", "NoOfImage", "NoOfJS", "NoOfCSS",
    "NoOfSelfRef", "NoOfExternalRef", "IsHTTPS", "HasObfuscation", "HasTitle",
    "HasDescription", "HasSubmitButton", "HasSocialNet", "HasFavicon",
    "HasCopyrightInfo", "popUpWindow", "Iframe", "Abnormal_URL",
    "LetterToDigitRatio", "Redirect_0", "Redirect_1"
]

# Modelos de entrada
class URLInput(BaseModel):
    url: str

class URLFeatures(BaseModel):
    URLLength: int
    DomainLength: int
    TLDLength: int
    NoOfImage: int
    NoOfJS: int
    NoOfCSS: int
    NoOfSelfRef: int
    NoOfExternalRef: int
    IsHTTPS: int
    HasObfuscation: int
    HasTitle: int
    HasDescription: int
    HasSubmitButton: int
    HasSocialNet: int
    HasFavicon: int
    HasCopyrightInfo: int
    popUpWindow: int
    Iframe: int
    Abnormal_URL: int
    LetterToDigitRatio: float
    Redirect_0: int
    Redirect_1: int

@app.post("/predict")
def predict(features: URLFeatures):
    try:
        input_df = pd.DataFrame([features.dict()], columns=FEATURE_COLUMNS)
        scaled_input = scaler.transform(input_df)
        dmatrix = xgb.DMatrix(scaled_input, feature_names=FEATURE_COLUMNS)
        pred = booster.predict(dmatrix)
        label = int(round(pred[0]))

        return {
            "prediction": label,
            "result": "Benigna" if label == 1 else "Maliciosa"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict_url")
def predict_from_url(input_data: URLInput):
    try:
        inicio = time.time()
        extractor = URLFeatureExtractor(input_data.url)
        features = extractor.extract_model_features()

        if "error" in features:
            return {"error": features["error"]}

        input_df = pd.DataFrame([features], columns=FEATURE_COLUMNS)
        scaled_input = scaler.transform(input_df)
        dmatrix = xgb.DMatrix(scaled_input, feature_names=FEATURE_COLUMNS)
        pred = booster.predict(dmatrix)
        label = int(round(pred[0]))
        fin = time.time()
        tiempo_ms = int((fin - inicio) * 1000)

        # 📉 Guardar en MySQL
        guardar_deteccion_mysql(
            input_data.url,
            "Benigna" if label == 1 else "Phishing",
            round(pred[0] * 100, 2),
            tiempo_ms
        )

        return {
            "features": features,
            "prediction": label,
            "result": "Benigna" if label == 1 else "Phishing",
            "score": round(pred[0], 4),
            "tiempo_ms": tiempo_ms
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def read_root():
    return {"message": "PhishShield API funcionando correctamente"}
