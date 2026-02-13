import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from urllib.parse import urlparse, quote
from datetime import datetime, timezone
import os
import random
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/smart-travel')
client = MongoClient(MONGO_URI)
parsed = urlparse(MONGO_URI)
db_name = parsed.path.strip('/') or 'smart-travel'
db = client[db_name]
print(f"Connected to MongoDB: {db_name}")

trips_collection = db['trips']
chats_collection = db['chats']


WIKI_HEADERS = {'User-Agent': 'SmartTravelBot/1.0 (educational project)'}

def wiki_search(query, limit=3):
    """Search Wikipedia and return list of {title, snippet}."""
    try:
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": query,
            "srlimit": limit
        }
        resp = requests.get("https://en.wikipedia.org/w/api.php", params=params, headers=WIKI_HEADERS, timeout=8)
        results = resp.json().get("query", {}).get("search", [])
        return [{"title": r["title"], "snippet": re.sub(r'<[^>]+>', '', r.get("snippet", ""))} for r in results]
    except Exception as e:
        print(f"[Wiki Search] Error: {e}")
        return []

def wiki_summary(title, msg_lower=""):
    """Get summarized content + high-quality image using Action API."""
    try:
        params = {
            "action": "query",
            "format": "json",
            "prop": "extracts|pageimages",
            "titles": title,
            "explaintext": 1,
            "exlimit": 1,
            "piprop": "thumbnail",
            "pithumbsize": 1000 
        }
        resp = requests.get("https://en.wikipedia.org/w/api.php", params=params, headers=WIKI_HEADERS, timeout=10)
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        
        full_extract = ""
        image = None
        page_id = None
        
        for pid, pg in pages.items():
            page_id = pid
            full_extract = pg.get("extract", "")
            image = pg.get("thumbnail", {}).get("source")
            break
            
        if not full_extract:
            return None, None, None

        sections = re.split(r'\n(==+ [^=]+ ==+)\n', full_extract)
        summary_parts = []
        intro = sections[0].strip()
        intro_paragraphs = intro.split('\n\n')[:2]
        summary_parts.append("\n\n".join(intro_paragraphs))

        relevant_headers = []
        if any(w in msg_lower for w in ['food', 'cuisine', 'dish', 'eat']):
            relevant_headers.extend(['Cuisine', 'Food', 'Dishes', 'Gastronomy'])
        if any(w in msg_lower for w in ['culture', 'tradition', 'dance', 'festival']):
            relevant_headers.extend(['Culture', 'Festivals', 'Arts', 'Music'])
        if any(w in msg_lower for w in ['history', 'historical', 'ancient']):
            relevant_headers.extend(['History', 'Ancient history', 'Medieval'])
        if any(w in msg_lower for w in ['tourism', 'travel', 'visit', 'places']):
            relevant_headers.extend(['Tourism', 'Places of interest', 'Transport', 'Landmarks'])

        for i in range(1, len(sections), 2):
            header = sections[i].replace('=', '').strip()
            content = sections[i+1].strip()
            if any(h.lower() in header.lower() for h in relevant_headers):
                section_lines = content.split('\n\n')[:1]
                summary_parts.append(f"### {header}\n" + "\n\n".join(section_lines))

        final_summary = "\n\n".join(summary_parts)
        if len(final_summary) > 2800:
            final_summary = final_summary[:2797] + "..."

        page_url = f"https://en.wikipedia.org/?curid={page_id}" if page_id and page_id != "-1" else None
            
        return final_summary, image, page_url
    except Exception as e:
        print(f"[Wiki Action API] Error: {e}")
        return None, None, None

def wiki_get_best(queries, msg_lower=""):
    """Try multiple queries and return the best result."""
    for q in queries:
        results = wiki_search(q, limit=1)
        if results:
            title = results[0]["title"]
            extract, image, page_url = wiki_summary(title, msg_lower)
            if extract and len(extract) > 30:
                return extract, image, page_url, title
    return None, None, None, None


LOCATION_KEYWORDS = {
    'kerala': 'Kerala', 'goa': 'Goa', 'rajasthan': 'Rajasthan', 'kashmir': 'Kashmir',
    'himachal': 'Himachal Pradesh', 'uttarakhand': 'Uttarakhand', 'karnataka': 'Karnataka',
    'tamil nadu': 'Tamil Nadu', 'maharashtra': 'Maharashtra', 'west bengal': 'West Bengal',
    'sikkim': 'Sikkim', 'ladakh': 'Ladakh', 'north east': 'North East India',
    'punjab': 'Punjab', 'gujarat': 'Gujarat', 'andhra': 'Andhra Pradesh',
    'arunachal': 'Arunachal Pradesh', 'puducherry': 'Puducherry', 'madhya pradesh': 'Madhya Pradesh',
    'mumbai': 'Mumbai', 'delhi': 'Delhi', 'bangalore': 'Bangalore', 'chennai': 'Chennai',
    'kolkata': 'Kolkata', 'hyderabad': 'Hyderabad', 'jaipur': 'Jaipur', 'udaipur': 'Udaipur',
    'varanasi': 'Varanasi', 'agra': 'Agra', 'manali': 'Manali', 'shimla': 'Shimla',
    'rishikesh': 'Rishikesh', 'mysore': 'Mysore', 'ooty': 'Ooty', 'munnar': 'Munnar',
    'darjeeling': 'Darjeeling', 'alleppey': 'Alleppey', 'coorg': 'Coorg',
    'jaisalmer': 'Jaisalmer', 'jodhpur': 'Jodhpur', 'pondicherry': 'Puducherry',
    'hampi': 'Hampi', 'khajuraho': 'Khajuraho', 'amritsar': 'Amritsar',
    'leh': 'Leh', 'gangtok': 'Gangtok', 'shillong': 'Shillong',
    'kodaikanal': 'Kodaikanal', 'nainital': 'Nainital', 'mussoorie': 'Mussoorie',
    'kovalam': 'Kovalam', 'varkala': 'Varkala', 'kochi': 'Kochi',
    'taj mahal': 'Taj Mahal', 'india': 'India',
}

GREETING_WORDS = ['hi', 'hello', 'hey', 'hola', 'namaste', 'good morning', 'good evening', 'good afternoon']
THANKS_WORDS = ['thank', 'thanks', 'thank you', 'thx']
BYE_WORDS = ['bye', 'goodbye', 'see you', 'later', 'take care']

GREETING_RESPONSES = [
    "Hello! I'm your Smart Travel AI."
]



def detect_location(message):
    msg_clean = message.lower().replace(" ", "")
    for keyword, location in LOCATION_KEYWORDS.items():
        if keyword.lower().replace(" ", "") in msg_clean:
            return location
    return None

def handle_tips(message):
    msg = message.lower()
    if any(w in msg for w in ['pack', 'packing', 'carry', 'luggage']): return TRAVEL_TIPS['packing']
    if any(w in msg for w in ['budget', 'save money', 'cheap', 'affordable']): return TRAVEL_TIPS['budget']
    if any(w in msg for w in ['safe', 'safety', 'precaution', 'secure']): return TRAVEL_TIPS['safety']
    if any(w in msg for w in ['best time', 'when to visit', 'season', 'weather']): return TRAVEL_TIPS['best_time']
    return None

def build_wiki_queries(msg_lower, location):
    """Build smart Wikipedia search queries based on what the user is asking."""
    queries = []
    
    if any(w in msg_lower for w in ['food', 'cuisine', 'dish', 'eat', 'restaurant', 'street food']):
        queries = [f"{location} cuisine", f"Cuisine of {location}", f"Food of {location}"]
        topic = "Cuisine"
    elif any(w in msg_lower for w in ['culture', 'tradition', 'dance', 'festival', 'art', 'music']):
        queries = [f"Culture of {location}", f"{location} culture", f"{location} traditions"]
        topic = "Culture"
    elif any(w in msg_lower for w in ['history', 'historical', 'ancient', 'heritage', 'old']):
        queries = [f"History of {location}", f"{location} history"]
        topic = "History"
    elif any(w in msg_lower for w in ['visit', 'places', 'tourist', 'attraction', 'see', 'explore', 'suggest', 'recommend', 'trip', 'travel', 'tour', 'plan']):
        queries = [f"Tourism in {location}", f"{location} tourism", f"{location} tourist attractions"]
        topic = "Tourism"
    elif any(w in msg_lower for w in ['about', 'what is', 'tell me', 'describe', 'know', 'famous']):
        queries = [location, f"{location} India", f"Tourism in {location}"]
        topic = "About"
    else:
        queries = [f"Tourism in {location}", location]
        topic = "About"
    
    return queries, topic


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "active", "db": db_name, "mode": "wikipedia"})

@app.route('/history', methods=['GET'])
def get_history():
    user_id = request.args.get('userId')
    if not user_id: return jsonify({"messages": []})
    try:
        chat_doc = chats_collection.find_one({"userId": ObjectId(user_id)})
        if chat_doc:
            messages = chat_doc.get('messages', [])
            for m in messages:
                if 'timestamp' in m: m['timestamp'] = str(m['timestamp'])
            return jsonify({"messages": messages})
    except Exception as e:
        print(f"[History] Fetch error: {e}")
    return jsonify({"messages": []})

@app.route('/history', methods=['DELETE'])
def delete_history():
    user_id = request.args.get('userId')
    if not user_id: return jsonify({"success": False})
    try:
        chats_collection.delete_one({"userId": ObjectId(user_id)})
        return jsonify({"success": True})
    except Exception as e:
        print(f"[History] Delete error: {e}")
        return jsonify({"success": False})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '').strip()
    user_id = data.get('userId')

    if not user_message:
        return jsonify({"text": "Please type a message!", "suggestions": [], "image": None})

    msg_lower = user_message.lower()
    location = detect_location(user_message)
    
    final_text = ""
    final_image = None
    final_suggestions = []

    if any(x in msg_lower for x in ['my trip', 'my plan', 'upcoming']):
        if not user_id:
            final_text = "Please login to see your trips!"
        else:
            try:
                user_trips = list(trips_collection.find({"owner": ObjectId(user_id)}).sort("startDate", -1).limit(5))
                if user_trips:
                    lines = [f"- **{t.get('title')}** ({t.get('status')})" for t in user_trips]
                    final_text = "**Your Trips:**\n\n" + "\n".join(lines)
                else:
                    final_text = "No trips found yet. Ask me about any place in India!"
            except:
                final_text = "Error fetching trips. Please try again."

    elif location:
        queries, topic = build_wiki_queries(msg_lower, location)
        extract, image, page_url, found_title = wiki_get_best(queries, msg_lower)
        
        if extract:
            final_text = f"**{topic} - {location}**\n\n{extract}"
            final_image = image
        else:
            final_text = f"I couldn't fetch information about {location} right now. Please check your internet connection and try again."

    elif any(re.search(rf'\b{re.escape(w)}\b', msg_lower) for w in GREETING_WORDS) and len(user_message.split()) <= 4:
        final_text = random.choice(GREETING_RESPONSES)

    elif any(re.search(rf'\b{re.escape(w)}\b', msg_lower) for w in THANKS_WORDS):
        final_text = "You're welcome! How else can I help you?"

    elif any(re.search(rf'\b{re.escape(w)}\b', msg_lower) for w in BYE_WORDS) and len(user_message.split()) <= 4:
        final_text = "Goodbye! Happy travels!"

    elif handle_tips(user_message):
        final_text = handle_tips(user_message)
    
    else:
        fallback_queries = [user_message]
        if any(w in msg_lower for w in ['food', 'cuisine', 'dish']): fallback_queries.insert(0, f"{user_message} cuisine")
        elif any(w in msg_lower for w in ['culture', 'tradition']): fallback_queries.insert(0, f"{user_message} culture")
        elif any(w in msg_lower for w in ['history', 'ancient']): fallback_queries.insert(0, f"{user_message} history")
        
        fallback_queries.append(f"{user_message} India")
        extract, image, page_url, found_title = wiki_get_best(fallback_queries, msg_lower)
        
        if extract:
            final_text = f"**{found_title}**\n\n{extract}"
            final_image = image
        else:
            final_text = (
                "I'm your AI Travel Assistant! I fetch real information from Wikipedia.\n\n"
                "**Try asking:**\n"
                "- 'Tell me about Kerala'\n"
                "- 'Best food in Rajasthan'\n"
                "- 'Culture of Goa'\n"
                "- 'History of Taj Mahal'\n"
                "- 'Places to visit in Shimla'\n\n"
                "**Travel Tips:**\n"
                "- 'Packing tips'\n"
                "- 'Best time to visit India'\n"
                "- 'Budget travel tips'"
            )

    if user_id:
        try:
            now = datetime.now(timezone.utc)
            chat_data = [
                {"sender": "user", "text": user_message, "timestamp": now},
                {"sender": "ai", "text": final_text, "image": final_image, "suggestions": [], "timestamp": now}
            ]
            chats_collection.update_one(
                {"userId": ObjectId(user_id)},
                {"$push": {"messages": {"$each": chat_data}}},
                upsert=True
            )
        except Exception as e:
            print(f"[Chat] Save error: {e}")

    return jsonify({"text": final_text, "image": final_image, "suggestions": []})

if __name__ == '__main__':
    print(f"Chatbot ready on port 5001 | Mode: Wikipedia API | DB: {db_name}")
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
