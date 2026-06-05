import os
from flask import Flask, request, jsonify
from chatbot import Chat

# Load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Try to import OpenAI
OPENAI_SUPPORTED = False
try:
    from openai import OpenAI
    OPENAI_SUPPORTED = True
except ImportError:
    pass

# Try to import Google Generative AI (Gemini)
GEMINI_SUPPORTED = False
try:
    import google.generativeai as genai
    GEMINI_SUPPORTED = True
except ImportError:
    pass

app = Flask(__name__)

# Initialize Chatbot using ahmadfaizalbh/Chatbot library as a fallback
template_path = os.path.join(os.path.dirname(__file__), "bot.template")

# System prompt to give the AI context about MBServices
SYSTEM_PROMPT = """You are a professional, friendly, and helpful virtual assistant for MBServices (Motomarket).
MBServices is a premium authorized motorcycle dealer and professional service workshop in Vietnam.
Key Information:
- We sell premium brands: Honda, Yamaha, Kawasaki, Ducati, BMW, Suzuki, Harley-Davidson, Triumph, KTM, and Royal Enfield.
- Services: Motorcycle sales, genuine accessories/spare parts, professional maintenance, repair, and test rides.
- Online payments: We support VNPay, ZaloPay, and Momo (with 10% deposit or full payment options).
- Delivery: Secure nationwide delivery is available.
- Working Hours: 8:00 AM - 8:00 PM, every day of the week.
- Warranty: 2-3 years or 20,000km - 30,000km depending on the model.
- Policies: We apply promo codes at checkout for discounts. Compare up to 4 bikes side-by-side.
Instructions:
- Keep answers polite, brief, and highly informative.
- Recommend visiting specific sections of our website (e.g., "Motorcycles" for browsing, "Services" for booking maintenance, "Book Test Ride" for trying a bike).
- ALWAYS respond in English. If the user writes in Vietnamese, reply in English.
"""

# Dictionary for expanding Vietnamese/English abbreviations, synonyms, teen-code, and common typos
ABBREVIATIONS = {
    # Vietnamese shorthand & teen-code
    "sđt": "phone",
    "sdt": "phone",
    "dt": "phone",
    "đt": "phone",
    "dc": "address",
    "đc": "address",
    "kh": "customer",
    "nv": "staff",
    "cskh": "staff",
    "sp": "product",
    "lh": "contact",
    "ko": "no",
    "k": "no",
    "kb": "don't know",
    "hcm": "ho chi minh",
    "hn": "ha noi",
    "km": "discount",
    "qc": "ad",
    "bh": "warranty",
    "bd": "maintenance",
    "ad": "admin",
    "ib": "message",
    "inbox": "message",
    "gút": "good",
    "ok": "good",
    "oke": "good",
    "tks": "thanks",
    "thank": "thanks",
    "thanks": "thanks",
    
    # Common synonyms / transition triggers (normalize to bot.template keywords or human staff)
    "gặp": "staff",
    "gap": "staff",
    "hỗ trợ": "staff",
    "ho tro": "staff",
    "tu van": "staff",
    "tư vấn": "staff",
    "gặp ai": "staff",
    "chat": "staff",
    "nói chuyện": "staff",
    "nhân viên": "staff",
    "nhan vien": "staff",
    "cskh": "staff",
    
    # Typos & English shorthand spelling correction
    "comapring": "compare",
    "comparing": "compare",
    "comp": "compare",
    "bảo dường": "maintenance",
    "bảo dưỡng": "maintenance",
    "baoduong": "maintenance",
    "laithu": "test ride",
    "chay thu": "test ride",
    "chạy thử": "test ride",
    "testride": "test ride",
    "test ride": "test ride",
    "dat lich": "book",
    "datlich": "book",
    "đặt lịch": "book",
    "khuyến mãi": "discount",
    "giảm giá": "discount",
    "uư đãi": "discount",
    "ưu đãi": "discount"
}

def normalize_text(text):
    if not text:
        return ""
    text = text.lower().strip()
    
    # Clean and expand abbreviations / typos using Word Boundary (\b) to avoid partial-word replacement
    # (e.g. replacing 'k' in 'kawasaki' or 'dt' in 'ducati')
    import re
    for abbrev, full_form in ABBREVIATIONS.items():
        text = re.sub(r'\b' + re.escape(abbrev) + r'\b', full_form, text)
        
    return text

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        # 1. Check if Gemini is configured (Preferred)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if GEMINI_SUPPORTED and gemini_key and not gemini_key.startswith("YOUR_"):
            try:
                # Use Google Gemini Pro 2.5 / 1.5 Flash (ultra-fast, highly intelligent, and free-tier friendly)
                genai.configure(api_key=gemini_key)
                gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash") # or gemini-2.5-flash / gemini-2.5-pro
                
                model = genai.GenerativeModel(
                    model_name=gemini_model_name,
                    system_instruction=SYSTEM_PROMPT
                )
                
                response_obj = model.generate_content(user_message)
                response = response_obj.text.strip()
                
                return jsonify({
                    "response": response,
                    "status": "success",
                    "model_used": gemini_model_name
                })
            except Exception as gemini_error:
                app.logger.error(f"Gemini API error: {str(gemini_error)}")
                # Fall back to OpenAI or template if Gemini fails

        # 2. Check if OpenAI is configured
        openai_key = os.getenv("OPENAI_API_KEY")
        if OPENAI_SUPPORTED and openai_key and not openai_key.startswith("YOUR_"):
            try:
                # Use OpenAI ChatGPT
                client = OpenAI(api_key=openai_key)
                completion = client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                response = completion.choices[0].message.content.strip()
                return jsonify({
                    "response": response,
                    "status": "success",
                    "model_used": os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                })
            except Exception as openai_error:
                app.logger.error(f"OpenAI API error: {str(openai_error)}")
                # Fall back to template if OpenAI API fails
        
        # 3. Fallback to local rule-based template
        normalized_message = normalize_text(user_message)
        bot = Chat(template_path)
        response = bot.respond(normalized_message)
        
        return jsonify({
            "response": response,
            "status": "success",
            "model_used": "rule-based-template"
        })
    except Exception as e:
        return jsonify({
            "response": "Sorry, the AI system is currently encountering an issue. Please try again later.",
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    # Return whether services are active
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_active = OPENAI_SUPPORTED and bool(openai_key) and not openai_key.startswith("YOUR_")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_active = GEMINI_SUPPORTED and bool(gemini_key) and not gemini_key.startswith("YOUR_")
    
    return jsonify({
        "status": "healthy",
        "openai_active": openai_active,
        "openai_supported": OPENAI_SUPPORTED,
        "gemini_active": gemini_active,
        "gemini_supported": GEMINI_SUPPORTED
    })

if __name__ == '__main__':
    # Print startup configuration summary
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_active = OPENAI_SUPPORTED and bool(openai_key) and not openai_key.startswith("YOUR_")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_active = GEMINI_SUPPORTED and bool(gemini_key) and not gemini_key.startswith("YOUR_")
    
    print("\n" + "="*50)
    print(" 🚀 MBSERVICES CHATBOT MICROSERVICE STARTED")
    print("="*50)
    print(f" 🟢 Port: 5000")
    print(f" 🤖 Google Gemini Support:  {'ACTIVE (Using ' + os.getenv('GEMINI_MODEL', 'gemini-1.5-flash') + ')' if gemini_active else 'INACTIVE (Key missing or SDK not installed)'}")
    print(f" 🧠 OpenAI ChatGPT Support: {'ACTIVE (Using ' + os.getenv('OPENAI_MODEL', 'gpt-4o-mini') + ')' if openai_active else 'INACTIVE (Key missing or SDK not installed)'}")
    print(f" 📦 Rule-Based Fallback:    ACTIVE (bot.template)")
    print("="*50 + "\n")
    
    # Run the Flask app on port 5000
    app.run(host='0.0.0.0', port=5000)
