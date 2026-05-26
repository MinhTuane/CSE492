import os
from flask import Flask, request, jsonify
from chatbot import Chat

app = Flask(__name__)

# Initialize Chatbot using ahmadfaizalbh/Chatbot library
template_path = os.path.join(os.path.dirname(__file__), "bot.template")

def normalize_text(text):
    if not text:
        return ""
    text = text.lower().strip()
    return text

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        normalized_message = normalize_text(user_message)
        
        bot = Chat(template_path)
        
        # Get response from bot
        response = bot.respond(normalized_message)
        
        return jsonify({
            "response": response,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "response": "Sorry, the AI system is currently encountering an issue. Please try again later.",
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(host='0.0.0.0', port=5000)
