# 🛡️ Fraud Detection Model — MoneyMate

> ML-powered real-time fraud detection for the MoneyMate (GenZ Money) platform.  
> Built with **XGBoost**, served via **FastAPI**, integrated into **Node.js/Express**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Dataset](#dataset)
- [Training Pipeline](#training-pipeline-mainpy)
- [Prediction API](#prediction-api-backendpy)
- [Node.js Integration](#nodejs-integration)
- [Running Both Servers](#running-both-servers)
- [API Reference](#api-reference)
- [Important Notes](#important-notes)
- [Quick Reference](#quick-reference)

---

## Overview

The fraud detection system scores every transaction in real-time before it is saved to the database. It returns a **fraud probability**, **risk level**, and **human-readable flags** explaining why a transaction was flagged.

```
User creates transaction
        ↓
Express receives POST /transaction
        ↓
fraudService.js calls FastAPI /predict
        ↓
XGBoost model scores the transaction
        ↓
CRITICAL → Block  |  Otherwise → Save & respond
```

The system has three components:

| File | Role |
|---|---|
| `main.py` | Training pipeline — trains and saves the model |
| `backend.py` | FastAPI server — serves real-time predictions |
| `fraudService.js` | Node.js integration — connects your app to the API |

---

## Project Structure

```
your_project/
├── fraud_dataset.xlsx          ← training data (1,000 transactions)
├── main.py                     ← training pipeline
├── backend.py                  ← FastAPI prediction server
├── fraudService.js             ← Node.js integration layer
└── models/                     ← auto-created after running main.py
    ├── fraud_model.pkl
    ├── scaler.pkl
    ├── label_encoders.pkl
    ├── feature_names.pkl
    ├── evaluation_plots.png
    └── feature_importance.png
```

---

## Requirements

### Python

```bash
pip install xgboost scikit-learn imbalanced-learn pandas openpyxl matplotlib joblib fastapi uvicorn
```

| Package | Version | Purpose |
|---|---|---|
| `xgboost` | ≥ 1.7 | Core ML model |
| `scikit-learn` | ≥ 1.3 | Preprocessing, metrics, train/test split |
| `imbalanced-learn` | ≥ 0.11 | SMOTE oversampling for class imbalance |
| `pandas` | ≥ 2.0 | Data loading and manipulation |
| `openpyxl` | ≥ 3.1 | Reading `.xlsx` dataset file |
| `matplotlib` | ≥ 3.7 | Evaluation plot generation |
| `joblib` | ≥ 1.3 | Model serialisation |
| `fastapi` | ≥ 0.110 | REST API framework |
| `uvicorn` | ≥ 0.29 | ASGI server to run FastAPI |

### Node.js

Inside your MoneyMate project:

```bash
npm install axios
```

---

## Dataset

### Overview

`fraud_dataset.xlsx` contains **1,000 synthetic transactions** with an **8% fraud rate** (80 fraud cases). It has two sheets: `Transactions` (raw data) and `Summary` (statistics).

### Feature Reference

| Feature | Type | Description |
|---|---|---|
| `transaction_id` | String | Unique transaction identifier |
| `user_id` | String | User identifier *(dropped at training)* |
| `timestamp` | DateTime | Transaction datetime *(dropped at training)* |
| `transaction_hour` | Integer | Hour of day (0–23) |
| `amount_inr` | Float | Transaction value in INR |
| `merchant_category` | String | Groceries, Electronics, ATM Withdrawal, etc. |
| `channel` | String | Online / Offline / ATM |
| `card_type` | String | Credit or Debit |
| `device_type` | String | Mobile, Desktop, Tablet, POS Terminal |
| `transaction_country` | String | Country where transaction occurred |
| `is_foreign_transaction` | Binary | 1 if country ≠ India |
| `is_new_device` | Binary | 1 if device not previously seen |
| `failed_attempts_before` | Integer | Failed auth attempts before this success |
| `txn_freq_last_1hr` | Integer | Number of transactions in the last hour |
| `velocity_flag` | Binary | 1 if `txn_freq_last_1hr` ≥ 5 |
| `avg_user_txn_amount` | Float | User's historical average transaction amount |
| `amount_deviation_pct` | Float | % deviation from user's average amount |
| `high_risk_merchant` | Binary | 1 for ATM, Online Shopping, Electronics |
| `is_fraud` | Binary | **TARGET** — 1 = fraud, 0 = legitimate |

---

## Training Pipeline (`main.py`)

### Run

```bash
python main.py
```

### Pipeline Stages

| Stage | Description | Output |
|---|---|---|
| **1 — Load** | Reads `fraud_dataset.xlsx` | DataFrame |
| **2 — Preprocess** | Label-encodes categoricals, saves encoders | `X`, `y`, encoders |
| **3 — Balance** | SMOTE + 80/20 split + StandardScaler | Train/test arrays |
| **4 — Train** | XGBoost with 5-fold cross-validation | Fitted model |
| **5 — Evaluate** | Classification report + ROC/PR curve plots | PNG files |
| **6 — Save** | Serialises model artifacts via joblib | 4 × `.pkl` files |

### Model Configuration

```python
XGBClassifier(
    n_estimators     = 300,
    max_depth        = 6,
    learning_rate    = 0.05,
    subsample        = 0.8,
    colsample_bytree = 0.8,
    scale_pos_weight = 10,    # handles class imbalance
)
```

### Expected Output

```
[4/6] Training XGBClassifier ...
      CV ROC-AUC: 0.9998 ± 0.0002

  CLASSIFICATION REPORT
              precision  recall  f1-score
       Legit     1.00    0.98     0.99
       Fraud     0.98    1.00     0.99
    accuracy                     0.99

  ROC-AUC Score       : 1.0000
  Avg Precision Score : 1.0000

✅ Pipeline complete. Run `uvicorn backend:app --reload` to serve predictions.
```

---

## Prediction API (`backend.py`)

### Start the Server

```bash
uvicorn backend:app --reload
```

Server runs at → `http://127.0.0.1:8000`  
Interactive docs → `http://127.0.0.1:8000/docs`

### Risk Levels

| Risk Level | Probability | Recommended Action |
|---|---|---|
| `SAFE` | 0% – 20% | ✅ Allow, save normally |
| `LOW` | 20% – 40% | ✅ Allow, log for review |
| `MEDIUM` | 40% – 60% | ⚠️ Allow + notify user |
| `HIGH` | 60% – 80% | ⚠️ Allow + flag for manual review |
| `CRITICAL` | 80% – 100% | ❌ Block transaction immediately |

### Sample Response

```json
{
  "is_fraud": true,
  "fraud_probability": 0.9231,
  "risk_level": "CRITICAL",
  "risk_score": 95,
  "flags": [
    "Unusual transaction hour (midnight–5 AM)",
    "Foreign transaction detected",
    "New / unrecognised device",
    "Multiple failed attempts before success (2)",
    "Amount deviates 8900% from user average",
    "High-risk merchant category: ATM Withdrawal"
  ],
  "model_version": "xgb-v1.0",
  "evaluated_at": "2026-04-18T10:23:45Z"
}
```

---

## Node.js Integration

### `services/fraudService.js`

```js
const axios = require("axios");

const FRAUD_API_URL = "http://localhost:8000/predict";

function buildFraudPayload(transaction) {
  const hour = new Date(transaction.createdAt).getHours();
  const deviation = transaction.userAvgAmount
    ? ((transaction.amount - transaction.userAvgAmount) / transaction.userAvgAmount) * 100
    : 0;

  return {
    transaction_hour:        hour,
    amount_inr:              transaction.amount,
    merchant_category:       transaction.merchantCategory  ?? "Online Shopping",
    channel:                 transaction.channel           ?? "Online",
    card_type:               transaction.cardType          ?? "Debit",
    device_type:             transaction.deviceType        ?? "Mobile",
    transaction_country:     transaction.country           ?? "India",
    is_foreign_transaction:  transaction.country !== "India" ? 1 : 0,
    is_new_device:           transaction.isNewDevice       ? 1 : 0,
    failed_attempts_before:  transaction.failedAttempts    ?? 0,
    txn_freq_last_1hr:       transaction.freqLastHour      ?? 1,
    velocity_flag:           (transaction.freqLastHour ?? 1) >= 5 ? 1 : 0,
    avg_user_txn_amount:     transaction.userAvgAmount     ?? 500,
    amount_deviation_pct:    parseFloat(deviation.toFixed(2)),
    high_risk_merchant:      ["ATM Withdrawal", "Online Shopping", "Electronics"]
                               .includes(transaction.merchantCategory) ? 1 : 0,
  };
}

async function checkFraud(transaction) {
  try {
    const payload  = buildFraudPayload(transaction);
    const response = await axios.post(FRAUD_API_URL, payload, { timeout: 5000 });
    return response.data;
  } catch (err) {
    // Fail open — don't block transactions if fraud API is down
    console.error("[FraudService] API unreachable:", err.message);
    return { is_fraud: false, fraud_probability: 0, risk_level: "UNKNOWN", flags: [] };
  }
}

module.exports = { checkFraud };
```

### `routes/transactions.js`

```js
const express        = require("express");
const router         = express.Router();
const { checkFraud } = require("../services/fraudService");

router.post("/", async (req, res) => {
  const transaction = req.body;

  // 1. Run fraud check BEFORE saving
  const fraudResult = await checkFraud(transaction);

  // 2. Attach fraud result to transaction record
  transaction.fraudScore = fraudResult.fraud_probability;
  transaction.riskLevel  = fraudResult.risk_level;
  transaction.fraudFlags = fraudResult.flags;
  transaction.isFlagged  = fraudResult.is_fraud;

  // 3. Block CRITICAL fraud immediately
  if (fraudResult.risk_level === "CRITICAL") {
    return res.status(403).json({
      success:    false,
      message:    "Transaction blocked due to high fraud risk.",
      risk_level: fraudResult.risk_level,
      flags:      fraudResult.flags,
    });
  }

  // 4. Save transaction to DB (your existing logic)
  // const saved = await Transaction.create(transaction);

  return res.status(201).json({
    success:     true,
    transaction: transaction,
    fraud_check: {
      risk_level:        fraudResult.risk_level,
      fraud_probability: fraudResult.fraud_probability,
      flags:             fraudResult.flags,
    },
  });
});

module.exports = router;
```

### DB Schema Fields to Add

```js
// Mongoose example — add to your existing TransactionSchema
fraudScore:  { type: Number,   default: 0 },       // 0.0 → 1.0
riskLevel:   { type: String,   default: "SAFE" },   // SAFE / LOW / MEDIUM / HIGH / CRITICAL
fraudFlags:  { type: [String], default: [] },       // reasons why flagged
isFlagged:   { type: Boolean,  default: false },
```

---

## Running Both Servers

You need **two terminals open simultaneously**:

```bash
# Terminal 1 — Fraud Detection API (Python)
cd "path\to\files"
uvicorn backend:app --reload --port 8000

# Terminal 2 — MoneyMate App (Node.js)
cd "path\to\moneymate"
npm run dev
```

---

## API Reference

### `POST /predict`

Score a single transaction.

**Request Body**

```json
{
  "transaction_hour": 2,
  "amount_inr": 45000.0,
  "merchant_category": "ATM Withdrawal",
  "channel": "Online",
  "card_type": "Credit",
  "device_type": "Mobile",
  "transaction_country": "Nigeria",
  "is_foreign_transaction": 1,
  "is_new_device": 1,
  "failed_attempts_before": 2,
  "txn_freq_last_1hr": 7,
  "velocity_flag": 1,
  "avg_user_txn_amount": 500.0,
  "amount_deviation_pct": 8900.0,
  "high_risk_merchant": 1
}
```

---

### `POST /predict/batch`

Score up to **500 transactions** in one request.

```json
{
  "transactions": [ { ...transaction1 }, { ...transaction2 } ]
}
```

---

### `GET /health`

```json
{ "status": "ok", "model_loaded": true, "features": 15 }
```

---

### `GET /model/info`

Returns feature names and all valid category values for each categorical field.

---

## Important Notes

### ⚠️ Model Performance on Real Data

The current ROC-AUC of **1.0** is because the model was trained on synthetic data with deliberately clear fraud patterns. With real transaction data, expect **0.85–0.95**, which is excellent for production fraud detection.

### 🔁 Retraining

When you have real data, replace `fraud_dataset.xlsx` and re-run:

```bash
python main.py
```

All artifacts in `models/` will be overwritten automatically.

### 🔒 Fail-Open Design

If the Python API is unreachable, `fraudService.js` **fails open** — it allows the transaction rather than blocking all payments. This prevents the fraud service from becoming a single point of failure.

### 🌍 Production: Use Environment Variables

```bash
# .env
FRAUD_API_URL=http://your-fraud-service-host:8000
```

```js
// fraudService.js
const FRAUD_API_URL = process.env.FRAUD_API_URL || "http://localhost:8000/predict";
```

---

## Quick Reference

| Task | Command |
|---|---|
| Install Python deps | `pip install xgboost scikit-learn imbalanced-learn pandas openpyxl matplotlib joblib fastapi uvicorn` |
| Train the model | `python main.py` |
| Start the API server | `uvicorn backend:app --reload` |
| View interactive API docs | Open `http://localhost:8000/docs` |
| Test health endpoint | `curl http://localhost:8000/health` |
| Install Node dep | `npm install axios` |

---

*MoneyMate — GenZ Money Platform · Fraud Detection Model v1.0*