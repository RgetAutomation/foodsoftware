from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
import sqlite3

app = Flask(__name__)
CORS(app)

# ----------- Paths -----------
DATA_FOLDER = "C:/restaurant billing software/food_item"
BILL_DIR = "C:/restaurant billing software/bills"
DB_PATH = os.path.join(DATA_FOLDER, "food_items.db")

os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(BILL_DIR, exist_ok=True)

# ----------- Init DB ----------
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                price REAL NOT NULL
            )
        """)

# ----------- API Routes ----------
@app.route('/get-items', methods=['GET'])
def get_items():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT id, name, category, price FROM items")
        items = [dict(row) for row in cur.fetchall()]
    return jsonify(items)

@app.route('/add-item', methods=['POST'])
def add_item():
    data = request.get_json()
    name = data.get("name")
    category = data.get("category", "Unknown")
    price = data.get("price")

    if not name or not isinstance(price, (int, float)):
        return jsonify({"success": False, "error": "Invalid data"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("INSERT INTO items (name, category, price) VALUES (?, ?, ?)", (name, category, price))
    return jsonify({"success": True})

@app.route('/edit-item/<int:item_id>', methods=['PUT'])
def edit_item(item_id):
    data = request.get_json()
    name = data.get("name")
    category = data.get("category")
    price = data.get("price")

    if not name or not isinstance(price, (int, float)):
        return jsonify({"success": False, "error": "Invalid data"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("UPDATE items SET name = ?, category = ?, price = ? WHERE id = ?", (name, category, price, item_id))
    return jsonify({"success": True})

@app.route('/delete-item/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
    return jsonify({"success": True})

@app.route("/bills", methods=["POST"])
def save_bill():
    try:
        data = request.get_json()
        if not data:
            return jsonify(success=False, error="No JSON received"), 400

        filename = f"bill_{int(datetime.now().timestamp())}.json"
        filepath = os.path.join(BILL_DIR, filename)

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e)), 500

# ----------- Start Flask ----------
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
