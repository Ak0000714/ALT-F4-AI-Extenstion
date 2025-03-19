import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Initialize AI Model
genai.configure(api_key="AIzaSyCkaiqx8ejPyGbC5r3qzwD-nj_7aIX1SS4")

# Store website usage and settings
usage_data = {}
dark_mode = False

@app.route('/track', methods=['POST'])
def track_usage():
    data = request.json
    site = data.get("site")
    time_spent = data.get("time_spent")
    category = categorize_site(site)

    if site and time_spent is not None:
        if site not in usage_data:
            usage_data[site] = {"timeSpent": 0, "limit": 30, "category": category}
        usage_data[site]["timeSpent"] += time_spent
        return jsonify({"message": "Data tracked successfully", "data": usage_data}), 200
    return jsonify({"error": "Invalid data"}), 400

@app.route('/suggest', methods=['POST'])
def suggest_alternative():
    data = request.json
    site = data.get("site")
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(f"What should I do instead of wasting time on {site}? Suggest productive alternatives.")
        suggestion = response.text
    except Exception as e:
        suggestion = "Try solving coding problems or reading something useful!"
    return jsonify({"suggestion": suggestion})

@app.route('/toggle-dark-mode', methods=['POST'])
def toggle_dark_mode():
    global dark_mode
    dark_mode = not dark_mode
    return jsonify({"darkMode": dark_mode})

@app.route('/export', methods=['GET'])
def export_data():
    return jsonify(usage_data)

@app.route('/import', methods=['POST'])
def import_data():
    global usage_data
    data = request.json.get("data", {})
    usage_data.update(data)
    return jsonify({"message": "Data imported successfully"})

@app.route('/set-limit', methods=['POST'])
def set_limit():
    data = request.json
    site = data.get("site")
    limit = data.get("limit")
    if site in usage_data and isinstance(limit, int):
        usage_data[site]["limit"] = limit
        return jsonify({"message": "Limit updated"}), 200
    return jsonify({"error": "Invalid request"}), 400

def categorize_site(url):
    categories = {
        "Entertainment": ["youtube", "netflix", "spotify", "hotstar"],
        "Learning": ["github", "leetcode", "geeksforgeeks", "stackoverflow", "udemy"],
        "Social Media": ["facebook", "instagram", "twitter", "reddit", "tiktok"],
        "Shopping": ["amazon", "flipkart", "ebay"],
        "Research": ["google", "wikipedia", "arxiv"]
    }
    for category, sites in categories.items():
        if any(site in url for site in sites):
            return category
    return "Others"

if __name__ == '__main__':
    app.run(debug=True)
