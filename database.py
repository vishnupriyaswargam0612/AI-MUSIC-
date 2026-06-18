import sqlite3
import hashlib
import os

DB_NAME = "database.db"

def get_db_connection(db_path=None):
    if not db_path:
        db_path = os.path.join(os.path.dirname(__file__), DB_NAME)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Create generated covers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS covers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mood TEXT NOT NULL,
        cover_path TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password):
    # Standard hashlib SHA-256 hashing (with a fixed salt for simplicity in this local app)
    salt = "algorythm_super_secret_salt_123!"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def create_user(email, password, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    pw_hash = hash_password(password)
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, pw_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {"id": user_id, "email": email}
    except sqlite3.IntegrityError:
        conn.close()
        return None  # User already exists

def verify_user(email, password, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    pw_hash = hash_password(password)
    
    cursor.execute(
        "SELECT id, email FROM users WHERE email = ? AND password_hash = ?",
        (email, pw_hash)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {"id": row["id"], "email": row["email"]}
    return None

def add_history(user_id, mood, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO history (user_id, mood) VALUES (?, ?)",
        (user_id, mood)
    )
    conn.commit()
    conn.close()

def get_history(user_id, limit=10, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT mood, timestamp FROM history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?",
        (user_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [{"mood": r["mood"], "timestamp": r["timestamp"]} for r in rows]

def add_cover(user_id, mood, cover_path, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO covers (user_id, mood, cover_path) VALUES (?, ?, ?)",
        (user_id, mood, cover_path)
    )
    conn.commit()
    conn.close()

def get_covers(user_id, db_path=None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, mood, cover_path, timestamp FROM covers WHERE user_id = ? ORDER BY timestamp DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [{"id": r["id"], "mood": r["mood"], "cover_path": r["cover_path"], "timestamp": r["timestamp"]} for r in rows]
