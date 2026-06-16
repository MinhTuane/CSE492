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

# Try to import Google GenAI (New SDK)
GEMINI_SUPPORTED = False
try:
    from google import genai
    from google.genai import types
    GEMINI_SUPPORTED = True
except ImportError:
    pass

app = Flask(__name__)

# Initialize Chatbot using ahmadfaizalbh/Chatbot library as a fallback
template_path = os.path.join(os.path.dirname(__file__), "bot.template")

# Function to generate a dynamic system prompt with the current time/date
def get_system_prompt():
    from datetime import datetime, timezone, timedelta
    vn_tz = timezone(timedelta(hours=7))
    now_str = datetime.now(vn_tz).strftime("%A, %Y-%m-%d %H:%M:%S")
    
    return f"""You are a professional, friendly, and helpful virtual assistant for MBServices (Motomarket).
MBServices is a premium authorized motorcycle dealer and professional service workshop in Vietnam.
Key Information:
- We sell premium brands: Honda, Yamaha, Kawasaki, Ducati, BMW, Suzuki, Harley-Davidson, Triumph, KTM, and Royal Enfield.
- Services: Motorcycle sales, genuine accessories/spare parts, professional maintenance, repair, and test rides.
- Online payments: We support VNPay, ZaloPay, and Momo (with 10% deposit or full payment options).
- Delivery: Secure nationwide delivery is available.
- Working Hours: 8:00 AM - 8:00 PM, every day of the week.
- Warranty: 2-3 years or 20,000km - 30,000km depending on the model.
- Policies: We apply promo codes at checkout for discounts. Compare up to 4 bikes side-by-side.
- Current Date and Time: {now_str} (Vietnam timezone, UTC+7). Use this to answer queries about the current time or day.
Instructions & Handling Specific Scenarios:
- [General]: Keep answers polite, brief, and highly informative. Respond in the user's language (Vietnamese/English).
- [Rich Previews]: Whenever you mention a specific motorcycle model, you MUST format it exactly like this: `[PRODUCT:Model Name]`. For example: `[PRODUCT:Kawasaki Ninja 400]` or `[PRODUCT:Honda CBR650R]`. Our system will automatically convert this tag into a beautiful Shopee-style product card with images and prices!
- [Vague Recommendations]: Act as an expert motorcycle consultant. If the user asks for a recommendation without giving criteria, do NOT barrage them with questions. Proactively suggest ONE popular "all-rounder" model using the product tag (e.g., [PRODUCT:Kawasaki Ninja 400]), passionately describe its best features, and THEN ask exactly ONE gentle follow-up question.
- [Force Choice]: If the user says "just pick 1 for me" or "I don't care", confidently select one flagship model, use the `[PRODUCT:...]` tag, explain why it's a universally great choice, and invite them to click the preview to see details. DO NOT evade.
- [Price Negotiation/Discounts]: If the user asks for a discount or "best price", mention our current promo codes available at checkout and encourage them to contact our human staff via the live chat for personalized deals.
- [Technical Support/Broken Bike]: If the user reports their bike is broken or making weird noises, express empathy, give one basic safety tip (e.g., "don't force the engine"), and strongly urge them to book a "Maintenance Service" on our website so our expert mechanics can inspect it.
- [Stock Availability/Colors]: If asked about specific stock or colors (e.g., "Do you have the R1 in black?"), advise them to click the product card or connect with a staff member for real-time inventory checks.
- [Competitor Comparison]: If asked why they should buy from MBServices instead of others, emphasize our status as an "Authorized Premium Dealer", 100% genuine parts, transparent online pricing, and top-tier warranty.
- [Off-topic/Chit-chat]: If the user asks off-topic questions (e.g., math, science, daily life) or is slightly rude/joking, answer briefly and politely, then smoothly pivot the conversation back to MBServices motorcycles.
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
        is_dummy_gemini = not gemini_key or gemini_key.startswith("YOUR_") or "your" in gemini_key.lower()
        if GEMINI_SUPPORTED and gemini_key and not is_dummy_gemini:
            try:
                # Use Google Gemini Pro 2.5 / 1.5 Flash (ultra-fast, highly intelligent, and free-tier friendly)
                client = genai.Client(api_key=gemini_key)
                gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite") # Use lite version to save quota
                
                response_obj = client.models.generate_content(
                    model=gemini_model_name,
                    contents=user_message,
                    config=types.GenerateContentConfig(
                        system_instruction=get_system_prompt()
                    )
                )
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
        is_dummy_openai = not openai_key or openai_key.startswith("YOUR_") or openai_key.startswith("sk-abcd") or "your" in openai_key.lower()
        if OPENAI_SUPPORTED and openai_key and not is_dummy_openai:
            try:
                # Use OpenAI ChatGPT
                client = OpenAI(api_key=openai_key)
                completion = client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    messages=[
                        {"role": "system", "content": get_system_prompt()},
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
@app.route('/models', methods=['GET'])
def list_models():
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or gemini_key.startswith("YOUR_"):
        return jsonify({"error": "No valid Gemini API key found"})
    try:
        client = genai.Client(api_key=gemini_key)
        models = client.models.list()
        # Return all model names that have 'flash' in them
        flash_models = [m.name for m in models if 'flash' in m.name.lower()]
        return jsonify({"available_flash_models": flash_models, "all_models": [m.name for m in models]})
    except Exception as e:
        return jsonify({"error": str(e)})

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
    print(f" 🤖 Google Gemini Support:  {'ACTIVE (Using ' + os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-lite') + ')' if gemini_active else 'INACTIVE (Key missing or SDK not installed)'}")
    print(f" 🧠 OpenAI ChatGPT Support: {'ACTIVE (Using ' + os.getenv('OPENAI_MODEL', 'gpt-4o-mini') + ')' if openai_active else 'INACTIVE (Key missing or SDK not installed)'}")
    print(f" 📦 Rule-Based Fallback:    ACTIVE (bot.template)")
    print("="*50 + "\n")
    
    # Run the Flask app on port 5000
    app.run(host='0.0.0.0', port=5000)
