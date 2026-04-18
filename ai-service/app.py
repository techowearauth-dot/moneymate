from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re
import os
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app requests

# Load ML model and vectorizer
try:
    with open("sms_model.pkl", "rb") as f:
        model = pickle.load(f)
    with open("tfidf_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
except Exception as e:
    print(f"Error loading models: {e}")

def extract_amount(text):
    """Extract currency amount using regex."""
    pattern = r'(?:[Rr][Ss]\.?|[Ii][Nn][Rr]|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)'
    match = re.search(pattern, text)
    if match:
        return float(match.group(1).replace(',', ''))
    return 0.0

def extract_merchant(text):
    """Extract merchant name from common transaction patterns."""
    text_clean = re.sub(r'rs\.?\s*[\d,.]+', '', text, flags=re.IGNORECASE)
    text_clean = re.sub(r'inr\s*[\d,.]+', '', text_clean, flags=re.IGNORECASE)
    text_clean = text_clean.lower()
    
    # Priority 1: VPA/UPI ID patterns
    vpa_match = re.search(r'vpa\s+([a-z0-9.]+@[a-z]+)', text_clean)
    if vpa_match:
        return vpa_match.group(1)

    # Priority 2: "paid to [Merchant]"
    paid_to_match = re.search(r'paid\s+to\s+([a-z0-9\s.]{3,30}?)(?=\s+for|\s+on|\s+at|\s+using|\s+ref|\.|$)', text_clean)
    if paid_to_match:
        return paid_to_match.group(1).strip().title()
    
    # Priority 3: "at [Merchant]"
    at_match = re.search(r'at\s+([a-z0-9\s.]{3,25}?)(?=\s+on|\s+for|\s+using|\s+ref|\.|$)', text_clean)
    if at_match:
        return at_match.group(1).strip().title()
    
    # Priority 4: "spent on [Merchant]"
    spent_match = re.search(r'spent\s+on\s+([a-z0-9\s.]{3,25}?)(?=\s+using|\s+ref|\.|$)', text_clean)
    if spent_match:
        return spent_match.group(1).strip().title()

    return "Unknown Merchant"

def calculate_anomaly(amount, history):
    """
    Calculate anomaly score based on historical transaction amounts.
    Returns (risk_level, reason)
    """
    if not history or len(history) < 3:
        # Not enough data to be "smart", use threshold
        if amount >= 10000: return 'HIGH', "Transaction amount exceeds significant threshold (₹10k+)"
        if amount >= 5000: return 'MEDIUM', "Large transaction amount detected"
        return 'LOW', ""

    amounts = [h.get('amount', 0) for h in history if h.get('type') == 'debit']
    if not amounts:
        return 'LOW', ""
        
    avg = sum(amounts) / len(amounts)
    
    # Simple Variance/StdDev for Anomaly
    variance = sum((x - avg) ** 2 for x in amounts) / len(amounts)
    std_dev = math.sqrt(variance)
    
    if std_dev == 0: std_dev = 1 # Prevent division by zero
    
    z_score = (amount - avg) / std_dev
    
    if amount > avg * 5 and amount > 2000:
        return 'HIGH', f"Extreme anomaly: {round(amount/avg, 1)}x higher than your average spend (₹{round(avg)})"
    
    if z_score > 3:
        return 'HIGH', f"High deviation detected from spending patterns (Z-Score: {round(z_score, 1)})"
    
    if z_score > 1.5:
        return 'MEDIUM', f"Spending is significantly higher than your typical average (₹{round(avg)})"
        
    return 'LOW', ""

@app.route('/analyze-contextual', methods=['POST'])
def analyze_contextual():
    try:
        data = request.get_json()
        sms_text = data.get('sms', '')
        history = data.get('history', []) # list of prev txns
        
        # 1. Base Analysis
        analysis = process_single_sms(sms_text)
        
        # 2. Contextual Anomaly Detection
        if analysis['type'] == 'debit':
            risk_level, reason = calculate_anomaly(analysis['amount'], history)
            analysis['riskLevel'] = risk_level
            analysis['anomalyReason'] = reason
        else:
            analysis['riskLevel'] = 'LOW'
            analysis['anomalyReason'] = ""
            
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-sms', methods=['POST'])
def analyze_sms():
    try:
        data = request.get_json()
        if not data or 'sms' not in data:
            return jsonify({"error": "No SMS text provided"}), 400
        return jsonify(process_single_sms(data['sms']))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    try:
        data = request.get_json()
        if not data or 'messages' not in data:
            return jsonify({"error": "No messages array provided"}), 400
        messages = data['messages']
        results = [process_single_sms(msg) for msg in messages]
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def process_single_sms(sms_text):
    vec = vectorizer.transform([sms_text])
    ml_category = model.predict(vec)[0]
    txn_type = get_hybrid_type(sms_text, ml_category)
    amount = extract_amount(sms_text)
    merchant = extract_merchant(sms_text)
    confidence = 0.95 if txn_type != 'other' else 0.85

    return {
        "type": txn_type,
        "amount": amount,
        "merchant": merchant,
        "original_sms": sms_text,
        "confidence": confidence,
        "ml_category": ml_category
    }

def get_hybrid_type(text, ml_category):
    text_lower = text.lower()
    debit_keywords = ['debited', 'spent', 'dr', 'paid to', 'withdrawn', 'payment', 'transfer to']
    credit_keywords = ['credited', 'received', 'cr', 'added to', 'refund', 'reversal', 'cashback']
    
    for kw in debit_keywords:
        if kw in text_lower: return 'debit'
    for kw in credit_keywords:
        if kw in text_lower: return 'credit'
    if ml_category.lower() in ['debit', 'credit']:
        return ml_category.lower()
    return 'other'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)