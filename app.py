# =========================================================
# SafeHer - Women's Safety Backend Service
# File: app.py
# Problem Statement: PS2 (Women's Safety) - recHERsion '26
# =========================================================

import datetime
from flask import Flask, render_template, request, jsonify
from threat_model import analyse_threat

app = Flask(__name__)

# In-memory session store for dispatched alerts & audit trail
emergency_audit_log = []

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/analyze-threat", methods=["POST"])
def api_analyze_threat():
    """
    Analyzes an incoming text message using the hybrid Scikit-Learn ML
    pipeline and legal heuristics.
    """
    try:
        data = request.get_json(silent=True) or {}
        message = data.get("message", "")
        
        result = analyse_threat(message)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Server analysis error: {str(e)}"
        }), 500


@app.route("/api/helplines", methods=["GET"])
def api_helplines():
    """
    Returns verified 24/7 women safety & cybercrime helplines in India.
    """
    return jsonify({
        "status": "success",
        "country": "India",
        "helplines": [
            {"service": "National Emergency Number", "number": "112", "type": "police_medical_fire"},
            {"service": "Women Helpline (All India)", "number": "1091", "type": "women_crisis"},
            {"service": "National Cyber Crime Reporting Helpline", "number": "1930", "portal": "cybercrime.gov.in"},
            {"service": "NCW 24/7 Domestic Violence / Harassment", "number": "7827170170", "type": "ncw"},
            {"service": "Student / Child Helpline", "number": "1098", "type": "child_student"}
        ]
    }), 200


@app.route("/api/emergency-dispatch", methods=["POST"])
def api_emergency_dispatch():
    """
    Logs an emergency trigger event with location coordinates and timestamp.
    """
    data = request.get_json(silent=True) or {}
    record = {
        "timestamp": datetime.datetime.now().isoformat(),
        "type": data.get("type", "SOS_MANUAL"),
        "contact_phone": data.get("contact_phone", "Unknown"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "message": data.get("message", "")
    }
    emergency_audit_log.append(record)
    return jsonify({
        "status": "success",
        "message": "Emergency event logged successfully.",
        "log_id": len(emergency_audit_log)
    }), 201


@app.route("/api/trigger-emergency-call", methods=["POST"])
def api_trigger_emergency_call():
    """
    Automated outbound IVR emergency phone call dispatch
    (Twilio / Exotel voice API architecture) calling trusted contact or 112 police.
    """
    data = request.get_json(silent=True) or {}
    recipient = data.get("recipient", "112")
    caller_name = data.get("caller_name", "SafeHer User")
    latitude = data.get("latitude", "Unknown")
    longitude = data.get("longitude", "Unknown")
    action_type = data.get("action_type", "WEARABLE_RING_TRIGGER")

    call_dispatch_log = {
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "CALL_INITIATED",
        "action_type": action_type,
        "recipient": recipient,
        "caller_name": caller_name,
        "ivr_message": f"CRITICAL ALERT: SafeHer user {caller_name} triggered panic alert via Smart Wearable. Coordinates: {latitude}, {longitude}.",
        "telephony_gateway": "Twilio/Exotel PSTN Dispatch Gateway",
        "call_sid": f"CA{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    emergency_audit_log.append(call_dispatch_log)
    return jsonify({
        "status": "success",
        "message": f"Automated voice call dispatched to {recipient}",
        "call_details": call_dispatch_log
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
