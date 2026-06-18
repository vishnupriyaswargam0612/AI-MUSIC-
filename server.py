from flask import Flask, request, jsonify, session, send_from_directory
import os
import secrets
from database import init_db, create_user, verify_user, add_history, get_history, add_cover, get_covers
from cover_generator import generate_album_cover

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.secret_key = os.environ.get("FLASK_SECRET_KEY", secrets.token_hex(24))

# Initialize database on startup
DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")
init_db(DB_PATH)

@app.route("/")
def home():
    # Redirect or serve welcome page
    return send_from_directory(app.static_folder, "welcome.html")

# ================= AUTHENTICATION APIs =================

@app.route("/api/auth/signup", methods=["POST"])
def signup_api():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = create_user(email, password, DB_PATH)
    if not user:
        return jsonify({"error": "User with this email already exists"}), 400
        
    return jsonify({"message": "User registered successfully! You can now login.", "user": user}), 201

@app.route("/api/auth/login", methods=["POST"])
def login_api():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
        
    user = verify_user(email, password, DB_PATH)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
        
    session["user_id"] = user["id"]
    session["user_email"] = user["email"]
    return jsonify({"message": "Login successful", "user": user}), 200

@app.route("/api/auth/logout", methods=["POST"])
def logout_api():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/api/auth/session", methods=["GET"])
def check_session():
    if "user_id" in session:
        return jsonify({"logged_in": True, "email": session["user_email"]}), 200
    return jsonify({"logged_in": False}), 200

# ================= PLAY HISTORY APIs =================

@app.route("/api/history", methods=["GET"])
def get_history_api():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    history = get_history(session["user_id"], limit=15, db_path=DB_PATH)
    return jsonify({"history": history}), 200

@app.route("/api/history", methods=["POST"])
def add_history_api():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    mood = data.get("mood")
    
    if not mood:
        return jsonify({"error": "Mood is required"}), 400
        
    add_history(session["user_id"], mood, DB_PATH)
    return jsonify({"message": "History updated"}), 201

# ================= ALBUM COVER GENERATION APIs =================

@app.route("/api/generate_cover", methods=["POST"])
def generate_cover_api():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    mood = data.get("mood", "happy")
    song_title = data.get("song_title", "My AI Rhythm")
    api_key = data.get("api_key") or session.get("gemini_api_key")
    
    cover_url = generate_album_cover(mood, song_title, session["user_email"], DB_PATH, api_key=api_key)
    add_cover(session["user_id"], mood, cover_url, DB_PATH)
    
    return jsonify({"cover_url": cover_url, "mood": mood, "song_title": song_title}), 200

@app.route("/api/covers", methods=["GET"])
def get_covers_api():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    covers = get_covers(session["user_id"], DB_PATH)
    return jsonify({"covers": covers}), 200

# Fallback to serve static files correctly
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
