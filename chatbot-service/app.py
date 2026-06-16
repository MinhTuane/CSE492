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

import requests

# Cache to avoid spamming the backend API
api_cache = {
    'motorcycles': [],
    'accessories': [],
    'last_fetch': None
}

def fetch_all_motorcycles():
    from datetime import datetime, timedelta
    now = datetime.now()
    if api_cache['last_fetch'] and (now - api_cache['last_fetch']) < timedelta(minutes=5):
        return api_cache['motorcycles']
        
    try:
        response = requests.get('http://localhost:8080/api/motorcycles/all', timeout=3)
        if response.status_code == 200:
            api_cache['motorcycles'] = response.json()
            # Also fetch accessories while we're at it
            acc_response = requests.get('http://localhost:8080/api/accessories', timeout=3)
            if acc_response.status_code == 200:
                api_cache['accessories'] = acc_response.json()
            api_cache['last_fetch'] = now
            return api_cache['motorcycles']
    except Exception as e:
        print(f"Error fetching data: {e}")
    return api_cache['motorcycles']

def fetch_all_accessories():
    return api_cache.get('accessories', [])

def get_n_best_motorcycles(motorcycles, n=10):
    if not motorcycles:
        return []
    # Sort by discount (highest first), then price (lowest first)
    sorted_bikes = sorted(
        motorcycles,
        key=lambda m: (m.get('discountPercentage') or 0.0, -(m.get('price') or 0.0)),
        reverse=True
    )
    return sorted_bikes[:n]

# Function to generate a dynamic system prompt with the current time/date
def get_system_prompt():
    from datetime import datetime, timezone, timedelta
    vn_tz = timezone(timedelta(hours=7))
    now_str = datetime.now(vn_tz).strftime("%A, %Y-%m-%d %H:%M:%S")
    
    def get_n_best_accessories(accessories, n=5):
        if not accessories:
            return []
        sorted_acc = sorted(
            accessories,
            key=lambda a: -(a.get('price') or 0.0) # Sort by most premium/expensive accessories
        )
        return sorted_acc[:n]
        
    # Fetch real data
    all_bikes = fetch_all_motorcycles()
    best_bikes = get_n_best_motorcycles(all_bikes, n=10)
    all_accs = fetch_all_accessories()
    best_accs = get_n_best_accessories(all_accs, n=5)
    
    best_bikes_str = ""
    first_bike_name = "Model Name"
    if best_bikes:
        first_bike_name = best_bikes[0].get('model', 'Model Name')
        for i, bike in enumerate(best_bikes):
            name = bike.get('model', '')
            brand = bike.get('brand', '')
            price = bike.get('price', 0)
            discount = bike.get('discountPercentage', 0)
            category = bike.get('category', '')
            best_bikes_str += f"  {i+1}. {brand} {name} (Category: {category}, Price: {price:,.0f} VND, Discount: {discount}%)\n"
    else:
        best_bikes_str = "  (Currently no real-time data available, please suggest standard models like Yamaha YZF-R3, Kawasaki Ninja 400)"

    best_accs_str = ""
    if best_accs:
        for i, acc in enumerate(best_accs):
            name = acc.get('name', '')
            price = acc.get('price', 0)
            category = acc.get('category', '')
            best_accs_str += f"  {i+1}. {name} (Category: {category}, Price: {price:,.0f} VND)\n"
    else:
        best_accs_str = "  (No real-time accessories data available right now)"

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
- [General]: Keep answers polite, brief, and highly informative. ALWAYS respond in ENGLISH, regardless of the language the user uses.
- [Available Models]: Here is the LIVE list of our current "Best Deals" based on real-time database data. You MUST pick from this list when recommending:
{best_bikes_str}
- [Accessories]: Here are our top featured accessories:
{best_accs_str}
- [Rich Previews]: Whenever you mention a specific motorcycle model, you MUST format it exactly like this: `[PRODUCT:Model Name]`. For example: `[PRODUCT:{first_bike_name}]`. Our system will automatically convert this tag into a beautiful Shopee-style product card!
- [Vague Recommendations]: If the user asks for a recommendation (even vaguely), YOU MUST IMMEDIATELY suggest exactly ONE specific model from our Available Models list using the `[PRODUCT:...]` tag. NEVER reply with only questions. Always give a product FIRST, then you may ask ONE short follow-up question.
- [Handling Rejections/Other Options]: If the user says they don't like your suggestion or asks for another option, YOU MUST IMMEDIATELY suggest a DIFFERENT motorcycle model using the `[PRODUCT:...]` tag. DO NOT recommend the same bike twice. DO NOT ask questions before giving the new option.
- [Force Choice]: If the user says "just pick 1 for me", "I don't care", or "infinite budget", YOU MUST pick ONE flagship model right away (e.g. `[PRODUCT:Ducati Panigale V4]`). NEVER ask for their budget or preferences in this case. Just pick one and be confident!
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
        history = data.get('history', [])
        
        # Build contents for Gemini
        gemini_contents = []
        for msg in history:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            gemini_contents.append({"role": role, "parts": [{"text": content}]})
        gemini_contents.append({"role": "user", "parts": [{"text": user_message}]})
        
        # Build messages for OpenAI
        openai_messages = [{"role": "system", "content": get_system_prompt()}]
        for msg in history:
            role = 'assistant' if msg.get('role') == 'model' else 'user'
            openai_messages.append({"role": role, "content": msg.get('content', '')})
        openai_messages.append({"role": "user", "content": user_message})
        
        # 1. Check if Gemini is configured (Preferred)
        gemini_key = os.getenv("GEMINI_API_KEY")
        is_dummy_gemini = not gemini_key or gemini_key.startswith("YOUR_") or "your" in gemini_key.lower()
        if GEMINI_SUPPORTED and gemini_key and not is_dummy_gemini:
            try:
                # Use Google Gemini Pro 2.5 / 1.5 Flash (ultra-fast, highly intelligent, and free-tier friendly)
                client = genai.Client(api_key=gemini_key)
                gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash") # Switch to 1.5-flash for higher free quota
                
                response_obj = client.models.generate_content(
                    model=gemini_model_name,
                    contents=gemini_contents,
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
                    messages=openai_messages,
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
        
        # If the template returns the default generic response, it might be due to AI rate limits.
        if response == "Sorry, I didn't quite catch that. You can ask me about: buying a bike, discounts, comparing models, test rides, maintenance, delivery, or store locations!":
            response = "I am currently receiving too many requests right now! Please wait a minute before asking me again, or click 'Live Support' to talk to our human staff."
            
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
