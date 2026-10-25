# =========================================================
# SafeHer - AI Threat Detection & Safety Engine
# File: threat_model.py
# Problem Statement: PS2 (Women's Safety - Digital & Physical)
# =========================================================

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

# ---------------------------------------------------------
# Training Dataset: Real-world Threat, Harassment & Safety
# ---------------------------------------------------------
TRAINING_DATA = [
    # Image Misuse / Blackmail / Sextortion (1)
    ("Send me your private photos or I will expose you online", 1),
    ("I have your private videos and pictures, pay me or I will leak them", 1),
    ("If you do not reply I will post your personal photos on Instagram and Telegram", 1),
    ("I will morph your face onto explicit photos and share with your family", 1),
    ("Send money right now or your pictures will be uploaded to the internet", 1),
    ("I will deepfake your photos and send them to your college professors", 1),
    ("Send me another video or I will show everyone what you sent me before", 1),
    ("Pay me 10000 rupees or I will share your screenshots with your friends", 1),
    
    # Physical Harm / Violent Threats (1)
    ("I will hurt you if you do not come outside right now", 1),
    ("I know where you live and I am coming for you tonight", 1),
    ("I will find you after your class and attack you", 1),
    ("You will regret rejecting me, I am going to make you pay with your life", 1),
    ("I am watching your house, you cannot hide from me", 1),
    ("I followed you home from the bus stop today", 1),
    ("No one will be able to save you when I catch you alone", 1),
    ("I will throw acid on your face if you talk to anyone else", 1),
    ("I am standing outside your hostel right now, come down", 1),
    ("I will kidnap you if you block me", 1),

    # Cyberstalking / Invasive Surveillance (1)
    ("Why did you ignore my call? I know you were online at 2 AM", 1),
    ("I installed a tracker on your phone, I know every place you go", 1),
    ("I have your live location, you are at the cafe with your friend", 1),
    ("Stop blocking my new numbers, I will keep making accounts to message you", 1),
    ("I hacked into your webcam and I can see you in your room", 1),
    ("I know your college schedule and which bus you take every day", 1),

    # Doxxing & Privacy Violations (1)
    ("I have your phone number, home address, and aadhaar details", 1),
    ("I am going to post your contact number on public escort websites", 1),
    ("I will leak your chat history to everyone in your college WhatsApp group", 1),
    ("I will share your personal email and passwords online", 1),

    # Coercive Phishing / Fraud targeting personal data (1)
    ("Send your OTP immediately or your account will be suspended and published", 1),
    ("Provide your bank PIN and card details or we will freeze your student account", 1),
    ("Click this link immediately to verify your confidential identity documents", 1),

    # Benign / Normal Messages (0)
    ("Hello, are you coming to college tomorrow?", 0),
    ("Can you please share the notes for today's computer science lecture?", 0),
    ("Hey! Let's meet at the library around 4 PM to work on our hackathon project", 0),
    ("Mom called, she asked if you reached home safely", 0),
    ("Thank you so much for helping me with the assignment yesterday", 0),
    ("Good morning! Wishing you a productive and wonderful day ahead", 0),
    ("Are you free for lunch in the college cafeteria today?", 0),
    ("Please text me once you reach your hostel safely", 0),
    ("Let's submit our project report before the 9 PM deadline tonight", 0),
    ("Congratulations on getting shortlisted for the presentation!", 0),
    ("Could you send me the Zoom link for the faculty meeting?", 0),
    ("I am taking the metro today, let me know if you want to join", 0),
    ("The weather is so pleasant today, let's go for a walk in the campus", 0),
    ("Happy birthday! Hope you have an amazing year ahead full of success", 0),
    ("Did you check the exam timetable published on the college portal?", 0),
    ("Please remember to carry your college ID card for verification tomorrow", 0),
    ("I'm running about 5 minutes late for the lab session, save me a seat", 0),
    ("Dinner is ready, please come to the mess whenever you are free", 0),
    ("Here is the GitHub link to our repository: please review the pull request", 0),
    ("Take care and get well soon, let me know if you need any medicines", 0)
]

messages = [item[0] for item in TRAINING_DATA]
labels = [item[1] for item in TRAINING_DATA]

# Build and train the Scikit-learn Pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 3), lowercase=True, max_features=1500)),
    ("classifier", LogisticRegression(C=2.0, max_iter=1000, random_state=42))
])

model.fit(messages, labels)

# ---------------------------------------------------------
# Rule-based Threat Category Heuristics
# ---------------------------------------------------------
CATEGORY_PATTERNS = [
    {
        "category": "Image Misuse & Blackmail",
        "regex": r"(private photos?|pictures?|videos?|leak|expose|morph|deepfake|nudes?|explicit|compromis)",
        "legal": "Sec 66E & 67A IT Act (Violation of bodily privacy & publishing obscene content); IPC Sec 354C (Voyeurism)",
        "severity": "CRITICAL"
    },
    {
        "category": "Physical Harm & Violent Threats",
        "regex": r"(hurt you|kill you|attack you|make you pay|acid|kidnap|harm you|punch|hit you|beat you)",
        "legal": "IPC Sec 503 & 506 (Criminal Intimidation); IPC Sec 354A (Sexual Harassment)",
        "severity": "CRITICAL"
    },
    {
        "category": "Cyberstalking & Surveillance",
        "regex": r"(watching you|follow(ed)? you|know where you live|outside your|tracker|hacked into your|camera|webcam|online at)",
        "legal": "IPC Sec 354D (Stalking - punishable up to 3-5 years imprisonment)",
        "severity": "HIGH"
    },
    {
        "category": "Doxxing & Privacy Breach",
        "regex": r"(home address|aadhaar|post your (contact|number)|phone number|leak your chat|publish your details)",
        "legal": "Sec 72A IT Act (Disclosure of personal info in breach of contract / consent)",
        "severity": "HIGH"
    },
    {
        "category": "Identity Misuse & Social Engineering",
        "regex": r"(otp|one time password|bank pin|card details|verify your account|click this link|claim your prize)",
        "legal": "Sec 66D IT Act (Cheating by personation using computer resource)",
        "severity": "MEDIUM"
    }
]


def analyse_threat(message: str) -> dict:
    """
    Analyzes an incoming message using the hybrid Scikit-Learn ML model
    and contextual legal rule-mapping.
    """
    text = (message or "").strip()
    if not text:
        return {
            "status": "error",
            "risk_level": "None",
            "risk_score": 0,
            "confidence": 0,
            "categories": [],
            "message": "Please enter a message to analyze.",
            "legal_info": None,
            "action_steps": []
        }

    # 1. ML Model Probability
    pred = model.predict([text])[0]
    probs = model.predict_proba([text])[0]
    harmful_prob = round(probs[1] * 100, 1)

    # 2. Extract Category matches
    matched_categories = []
    legal_references = []
    detected_words = []

    text_lower = text.lower()
    for cat in CATEGORY_PATTERNS:
        matches = re.findall(cat["regex"], text_lower)
        if matches:
            matched_categories.append(cat["category"])
            legal_references.append(cat["legal"])
            detected_words.extend([m[0] if isinstance(m, tuple) else m for m in matches])

    # 3. Determine Overall Risk Level
    if pred == 1 or harmful_prob >= 50 or len(matched_categories) >= 1:
        if any(cat in matched_categories for cat in ["Image Misuse & Blackmail", "Physical Harm & Violent Threats"]) or harmful_prob >= 75:
            risk_level = "High Risk"
            risk_class = "danger"
        else:
            risk_level = "Moderate Risk"
            risk_class = "warning"
        
        if not matched_categories:
            matched_categories.append("Intimidating / Harassing Tone")
            legal_references.append("IPC Sec 509 (Word, gesture or act intended to insult modesty of a woman)")
    else:
        risk_level = "Low / Safe"
        risk_class = "safe"

    # 4. Actionable Steps tailored to recHERsion PS2
    if risk_level == "High Risk":
        action_steps = [
            "Do NOT delete the conversation. Take full-screen screenshots showing the sender's handle/phone number.",
            "Do NOT comply with demands or send money/photos. Block the sender once evidence is preserved.",
            "Report immediately to the National Cyber Crime Portal (helpline 1930 or cybercrime.gov.in).",
            "Dial 112 (National Emergency) or 1091 (Women Helpline) if you suspect immediate physical danger."
        ]
    elif risk_level == "Moderate Risk":
        action_steps = [
            "Exercise caution. Never share OTPs, passwords, or personal schedules with unverified contacts.",
            "Save this incident to your local Incident Log for timestamped records.",
            "Set strict privacy settings on your social accounts (private profile, restrict message requests)."
        ]
    else:
        action_steps = [
            "No clear threat or harassment markers were detected by the model.",
            "Remember: Trust your instincts. If a conversation feels uncomfortable, you have the right to disengage."
        ]

    return {
        "status": "success",
        "risk_level": risk_level,
        "risk_class": risk_class,
        "confidence": max(harmful_prob if risk_level != "Low / Safe" else round((100 - harmful_prob), 1), 50.0),
        "categories": list(dict.fromkeys(matched_categories)),
        "detected_keywords": list(dict.fromkeys(detected_words))[:5],
        "legal_advisory": " | ".join(dict.fromkeys(legal_references)) if legal_references else "N/A",
        "action_steps": action_steps,
        "helplines": {
            "National Emergency": "112",
            "Women Helpline": "1091",
            "Cyber Crime Helpline": "1930",
            "NCW Women Helpline": "7827170170"
        }
    }


if __name__ == "__main__":
    test_msg = "Send me your private photos or I will expose you online"
    res = analyse_threat(test_msg)
    print("Test Result:", res)
