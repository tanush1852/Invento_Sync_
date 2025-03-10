import google.generativeai as genai
import json

# Set up Gemini API
API_KEY = "AIzaSyBPehLg83WKXg-klMHqv6HsaYow53CHZ6Q"
genai.configure(api_key=API_KEY)

def analyze_inventory(data):
    prompt = """
    Analyze the given product inventory data, to identify the following inferences:
    1. Three products that are high in demand but have relatively low stock.
    2. Three products that are low in demand but have high stock availability.
    
    Return the output data as a structured JSON with two lists:
    - 'high_demand_low_stock': Python list ontains three such products.
    - 'low_demand_high_stock': Python list contains three such products.

{{
    "high_demand_low_stock": ["Product 1", "Product 2", "Product 3"],
    "low_demand_high_stock": ["Product 4", "Product 5", "Product 6"]
}}
    
    Source Data:
    """ + json.dumps(data, indent=4) + """

I want only the final data output in the form of a structured JSON. Do not give any training explanation or text or markdown or code. Just give the final output JSON.
    """
    
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text

# Sample JSON data
json_data = {
    "products": [
        {"name": "Fairy Lights", "stock": 50, "sales_quantity": 200, "low_threshold": 100, "high_threshold": 5000},
        {"name": "Protein Shake", "stock": 5000, "sales_quantity": 50, "low_threshold": 20, "high_threshold": 4000},
        {"name": "Chocolate", "stock": 8000, "sales_quantity": 600, "low_threshold": 10, "high_threshold": 10000},
        {"name": "Facewash", "stock": 600, "sales_quantity": 30, "low_threshold": 50, "high_threshold": 1000},
        {"name": "Fairy LG", "stock": 150, "sales_quantity": 400, "low_threshold": 100, "high_threshold": 5000},
        {"name": "Electric car", "stock": 100, "sales_quantity": 0, "low_threshold": 1, "high_threshold": 30000}
    ]
}

# Get Gemini API response
response = analyze_inventory(json_data)

## script to clean the response - split on brackets to just extract the json
response = response.split("{")[1].split("}")[0]
response = "{" + response + "}"
response = json.loads(response)

print(response)
