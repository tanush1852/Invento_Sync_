from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import google.generativeai as genai  # Gemini API
import re  # Import regex for extracting numbers

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up Google Gemini API
genai.configure(api_key="AIzaSyBPehLg83WKXg-klMHqv6HsaYow53CHZ6Q")

@app.route('/get_travel_time', methods=['POST'])
def get_travel_time():
    try:
        data = request.json
        origin = data.get('origin')
        destination = data.get('destination')

        if not origin or not destination:
            return jsonify({"error": "Invalid data"}), 400

        # Use Gemini to estimate travel time
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""
        Estimate the driving time in minutes between two locations: 
        Origin: {origin} 
        Destination: {destination}.
        ask googlemaps and get the real time travelling time if travelling is assumed by road and always recheck before putting the time.
        Double check before getting the travel time.
        """

        response = model.generate_content(prompt)

        # Extract number from Gemini response
        response_text = response.text
        match = re.search(r"\d+", response_text)  # Find first number
        if match:
            travel_time = int(match.group())  # Convert to integer
            return jsonify({"travel_time": travel_time})

        return jsonify({"error": "Failed to estimate travel time"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
