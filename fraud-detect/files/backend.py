"""
Fraud Detection - FastAPI Prediction Backend
Run: uvicorn backend:app --reload
Docs: http://localhost:8000/docs
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────
app = FastAPI(
    title="Fraud Detection API",
    description="ML-powered real-time fraud detection for transaction logs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = "models"

# ─────────────────────────────────────────────
# LOAD ARTIFACTS AT STARTUP
# ─────────────────────────────────────────────
@app.on_event("startup")
def load_model_artifacts():
    global model, scaler, label_encoders, feature_names

    required = ["fraud_model.pkl", "scaler.pkl", "label_encoders.pkl", "feature_names.pkl"]
    missing  = [f for f in required if not os.path.exists(os.path.join(MODEL_DIR, f))]

    if missing:
        raise RuntimeError(
            f"Missing model artifacts: {missing}. "
            "Run `python main.py` first to train and save the model."
        )

    model          = joblib.load(os.path.join(MODEL_DIR, "fraud_model.pkl"))
    scaler         = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
    label_encoders = joblib.load(os.path.join(MODEL_DIR, "label_encoders.pkl"))
    feature_names  = joblib.load(os.path.join(MODEL_DIR, "feature_names.pkl"))

    print("✅ Model artifacts loaded successfully.")


# ─────────────────────────────────────────────
# REQUEST / RESPONSE SCHEMAS
# ─────────────────────────────────────────────
class TransactionRequest(BaseModel):
    transaction_hour:        int   = Field(..., ge=0, le=23,  example=2,        description="Hour of day (0–23)")
    amount_inr:              float = Field(..., gt=0,          example=45000.0,  description="Transaction amount in INR")
    merchant_category:       str   = Field(...,                example="ATM Withdrawal")
    channel:                 str   = Field(...,                example="Online")
    card_type:               str   = Field(...,                example="Credit")
    device_type:             str   = Field(...,                example="Mobile")
    transaction_country:     str   = Field(...,                example="Nigeria")
    is_foreign_transaction:  int   = Field(..., ge=0, le=1,   example=1)
    is_new_device:           int   = Field(..., ge=0, le=1,   example=1)
    failed_attempts_before:  int   = Field(..., ge=0,          example=2)
    txn_freq_last_1hr:       int   = Field(..., ge=0,          example=7)
    velocity_flag:           int   = Field(..., ge=0, le=1,   example=1)
    avg_user_txn_amount:     float = Field(..., gt=0,          example=500.0,    description="User's historical avg transaction amount")
    amount_deviation_pct:    float = Field(...,                example=8900.0,   description="% deviation from user's avg amount")
    high_risk_merchant:      int   = Field(..., ge=0, le=1,   example=1)

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_hour":        2,
                "amount_inr":              45000.0,
                "merchant_category":       "ATM Withdrawal",
                "channel":                 "Online",
                "card_type":               "Credit",
                "device_type":             "Mobile",
                "transaction_country":     "Nigeria",
                "is_foreign_transaction":  1,
                "is_new_device":           1,
                "failed_attempts_before":  2,
                "txn_freq_last_1hr":       7,
                "velocity_flag":           1,
                "avg_user_txn_amount":     500.0,
                "amount_deviation_pct":    8900.0,
                "high_risk_merchant":      1,
            }
        }


class PredictionResponse(BaseModel):
    is_fraud:          bool
    fraud_probability: float
    risk_level:        str
    risk_score:        int
    flags:             list[str]
    model_version:     str
    evaluated_at:      str


class BatchTransactionRequest(BaseModel):
    transactions: list[TransactionRequest]


class BatchPredictionResponse(BaseModel):
    total:           int
    fraud_detected:  int
    results:         list[PredictionResponse]


class HealthResponse(BaseModel):
    status:        str
    model_loaded:  bool
    features:      int


# ─────────────────────────────────────────────
# HELPER: PREPROCESS A SINGLE TRANSACTION
# ─────────────────────────────────────────────
CAT_COLS = ["merchant_category", "channel", "card_type", "device_type", "transaction_country"]

def preprocess_input(txn: TransactionRequest) -> np.ndarray:
    data = txn.model_dump()
    df   = pd.DataFrame([data])

    for col in CAT_COLS:
        le = label_encoders.get(col)
        if le is None:
            raise HTTPException(status_code=500, detail=f"Encoder missing for column: {col}")
        val = df[col].astype(str).values[0]
        if val not in le.classes_:
            # Unseen category → map to most frequent class (index 0)
            df[col] = le.transform([le.classes_[0]])
        else:
            df[col] = le.transform([val])

    df = df[feature_names]  # ensure column order matches training
    return scaler.transform(df)


def build_flags(txn: TransactionRequest, prob: float) -> list[str]:
    flags = []
    if txn.transaction_hour in range(0, 5):
        flags.append("Unusual transaction hour (midnight–5 AM)")
    if txn.is_foreign_transaction:
        flags.append("Foreign transaction detected")
    if txn.is_new_device:
        flags.append("New / unrecognised device")
    if txn.failed_attempts_before >= 2:
        flags.append(f"Multiple failed attempts before success ({txn.failed_attempts_before})")
    if txn.velocity_flag or txn.txn_freq_last_1hr >= 5:
        flags.append(f"High transaction velocity ({txn.txn_freq_last_1hr} txns in last hour)")
    if txn.amount_deviation_pct > 500:
        flags.append(f"Amount deviates {txn.amount_deviation_pct:.0f}% from user average")
    if txn.high_risk_merchant:
        flags.append(f"High-risk merchant category: {txn.merchant_category}")
    return flags


def risk_level(prob: float) -> tuple[str, int]:
    if prob >= 0.80:
        return "CRITICAL", 95
    elif prob >= 0.60:
        return "HIGH", 75
    elif prob >= 0.40:
        return "MEDIUM", 50
    elif prob >= 0.20:
        return "LOW", 25
    else:
        return "SAFE", 5


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.get("/", tags=["General"])
def root():
    return {"message": "Fraud Detection API is running. Visit /docs for the full API reference."}


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health():
    return {
        "status":       "ok",
        "model_loaded": model is not None,
        "features":     len(feature_names),
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(txn: TransactionRequest):
    """
    Score a single transaction and return fraud probability + risk flags.
    """
    try:
        X        = preprocess_input(txn)
        prob     = float(model.predict_proba(X)[0][1])
        is_fraud = prob >= 0.5
        level, score = risk_level(prob)
        flags    = build_flags(txn, prob)

        return PredictionResponse(
            is_fraud          = is_fraud,
            fraud_probability = round(prob, 4),
            risk_level        = level,
            risk_score        = score,
            flags             = flags,
            model_version     = "xgb-v1.0",
            evaluated_at      = datetime.utcnow().isoformat() + "Z",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch(payload: BatchTransactionRequest):
    """
    Score multiple transactions in one request. Max 500 per call.
    """
    if len(payload.transactions) > 500:
        raise HTTPException(status_code=400, detail="Batch limit is 500 transactions per request.")

    results = []
    for txn in payload.transactions:
        try:
            X        = preprocess_input(txn)
            prob     = float(model.predict_proba(X)[0][1])
            is_fraud = prob >= 0.5
            level, score = risk_level(prob)
            flags    = build_flags(txn, prob)
            results.append(PredictionResponse(
                is_fraud          = is_fraud,
                fraud_probability = round(prob, 4),
                risk_level        = level,
                risk_score        = score,
                flags             = flags,
                model_version     = "xgb-v1.0",
                evaluated_at      = datetime.utcnow().isoformat() + "Z",
            ))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing transaction: {str(e)}")

    fraud_count = sum(1 for r in results if r.is_fraud)

    return BatchPredictionResponse(
        total          = len(results),
        fraud_detected = fraud_count,
        results        = results,
    )


@app.get("/model/info", tags=["Model"])
def model_info():
    """
    Returns feature names and model metadata.
    """
    return {
        "model_type":    type(model).__name__,
        "model_version": "xgb-v1.0",
        "features":      feature_names,
        "feature_count": len(feature_names),
        "categories":    {col: list(le.classes_) for col, le in label_encoders.items()},
    }
