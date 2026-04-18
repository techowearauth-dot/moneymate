"""
Fraud Detection - Training Pipeline
Run: python main.py
Outputs: models/fraud_model.pkl, models/scaler.pkl, models/label_encoders.pkl
"""

import os
import joblib
import warnings
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report, roc_auc_score, confusion_matrix,
    ConfusionMatrixDisplay, roc_curve, precision_recall_curve, average_precision_score
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
# DATA_PATH   = "fraud_dataset.xlsx"
DATA_PATH = r"C:\Users\rajes\OneDrive\Desktop\GenZ Money\moneymate\fraud-detect\fraud_dataset.xlsx"
MODEL_DIR   = "models"
SHEET_NAME  = "Transactions"

DROP_COLS   = ["transaction_id", "user_id", "timestamp"]
TARGET_COL  = "is_fraud"
CAT_COLS    = ["merchant_category", "channel", "card_type", "device_type", "transaction_country"]

XGBOOST_PARAMS = {
    "n_estimators":     300,
    "max_depth":        6,
    "learning_rate":    0.05,
    "subsample":        0.8,
    "colsample_bytree": 0.8,
    "scale_pos_weight": 10,
    "use_label_encoder": False,
    "eval_metric":      "aucpr",
    "random_state":     42,
    "n_jobs":           -1,
}


# ─────────────────────────────────────────────
# 1. LOAD DATA
# ─────────────────────────────────────────────
def load_data(path: str) -> pd.DataFrame:
    print(f"[1/6] Loading data from '{path}' ...")
    df = pd.read_excel(path, sheet_name=SHEET_NAME)
    print(f"      Shape: {df.shape} | Fraud rate: {df[TARGET_COL].mean()*100:.2f}%")
    return df


# ─────────────────────────────────────────────
# 2. PREPROCESS
# ─────────────────────────────────────────────
def preprocess(df: pd.DataFrame):
    print("[2/6] Preprocessing ...")
    df = df.copy()

    # Drop non-feature columns
    df.drop(columns=[c for c in DROP_COLS if c in df.columns], inplace=True)

    # Encode categoricals — save encoders for inference
    label_encoders = {}
    for col in CAT_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]
    print(f"      Features: {list(X.columns)}")
    return X, y, label_encoders


# ─────────────────────────────────────────────
# 3. BALANCE + SPLIT
# ─────────────────────────────────────────────
def balance_and_split(X, y):
    print("[3/6] Applying SMOTE & splitting ...")
    sm = SMOTE(random_state=42)
    X_res, y_res = sm.fit_resample(X, y)

    X_train, X_test, y_train, y_test = train_test_split(
        X_res, y_res, test_size=0.2, stratify=y_res, random_state=42
    )

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    print(f"      Train: {X_train.shape} | Test: {X_test.shape}")
    return X_train, X_test, y_train, y_test, scaler


# ─────────────────────────────────────────────
# 4. TRAIN
# ─────────────────────────────────────────────
def train(X_train, y_train):
    print("[4/6] Training XGBClassifier ...")
    model = XGBClassifier(**XGBOOST_PARAMS)
    model.fit(X_train, y_train, verbose=False)

    # Cross-validation ROC-AUC
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")
    print(f"      CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    return model


# ─────────────────────────────────────────────
# 5. EVALUATE
# ─────────────────────────────────────────────
def evaluate(model, X_test, y_test, feature_names):
    print("[5/6] Evaluating ...")
    y_pred      = model.predict(X_test)
    y_proba     = model.predict_proba(X_test)[:, 1]
    roc_auc     = roc_auc_score(y_test, y_proba)
    avg_prec    = average_precision_score(y_test, y_proba)

    print("\n" + "="*55)
    print("  CLASSIFICATION REPORT")
    print("="*55)
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))
    print(f"  ROC-AUC Score       : {roc_auc:.4f}")
    print(f"  Avg Precision Score : {avg_prec:.4f}")
    print("="*55 + "\n")

    os.makedirs(MODEL_DIR, exist_ok=True)

    # — Confusion Matrix
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    cm = confusion_matrix(y_test, y_pred)
    ConfusionMatrixDisplay(cm, display_labels=["Legit", "Fraud"]).plot(ax=axes[0], colorbar=False)
    axes[0].set_title("Confusion Matrix")

    # — ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    axes[1].plot(fpr, tpr, color="darkorange", lw=2, label=f"AUC = {roc_auc:.3f}")
    axes[1].plot([0,1],[0,1],"k--", lw=1)
    axes[1].set_xlabel("False Positive Rate"); axes[1].set_ylabel("True Positive Rate")
    axes[1].set_title("ROC Curve"); axes[1].legend()

    # — Precision-Recall Curve
    prec, rec, _ = precision_recall_curve(y_test, y_proba)
    axes[2].plot(rec, prec, color="steelblue", lw=2, label=f"AP = {avg_prec:.3f}")
    axes[2].set_xlabel("Recall"); axes[2].set_ylabel("Precision")
    axes[2].set_title("Precision-Recall Curve"); axes[2].legend()

    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, "evaluation_plots.png"), dpi=150)
    plt.close()
    print("      Plots saved → models/evaluation_plots.png")

    # — Feature Importance
    fig2, ax2 = plt.subplots(figsize=(10, 6))
    imp = pd.Series(model.feature_importances_, index=feature_names).nlargest(15)
    imp.sort_values().plot(kind="barh", ax=ax2, color="steelblue")
    ax2.set_title("Top 15 Feature Importances"); ax2.set_xlabel("Importance Score")
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, "feature_importance.png"), dpi=150)
    plt.close()
    print("      Feature importance saved → models/feature_importance.png")


# ─────────────────────────────────────────────
# 6. SAVE ARTIFACTS
# ─────────────────────────────────────────────
def save_artifacts(model, scaler, label_encoders, feature_names):
    print("[6/6] Saving model artifacts ...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model,          os.path.join(MODEL_DIR, "fraud_model.pkl"))
    joblib.dump(scaler,         os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(label_encoders, os.path.join(MODEL_DIR, "label_encoders.pkl"))
    joblib.dump(feature_names,  os.path.join(MODEL_DIR, "feature_names.pkl"))

    print(f"      ✓ models/fraud_model.pkl")
    print(f"      ✓ models/scaler.pkl")
    print(f"      ✓ models/label_encoders.pkl")
    print(f"      ✓ models/feature_names.pkl")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "="*55)
    print("  FRAUD DETECTION — TRAINING PIPELINE")
    print("="*55 + "\n")

    df                                           = load_data(DATA_PATH)
    X, y, label_encoders                         = preprocess(df)
    X_train, X_test, y_train, y_test, scaler     = balance_and_split(X, y)
    model                                        = train(X_train, y_train)
    evaluate(model, X_test, y_test, list(X.columns))
    save_artifacts(model, scaler, label_encoders, list(X.columns))

    print("\n✅ Pipeline complete. Run `uvicorn backend:app --reload` to serve predictions.\n")
