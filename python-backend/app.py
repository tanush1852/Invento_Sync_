from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
from modules.models import LLMModelInterface
import requests
import google.generativeai as genai  # Gemini API
import re  # Import regex for extracting numbers
import json
from dotenv import load_dotenv
import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials
import re
from google.oauth2.service_account import Credentials
import gspread
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import markdown
from googleapiclient.discovery import build

load_dotenv()
MONGO_URI = ""
DB_NAME = ""
GEMINI_API_KEY = "AIzaSyDyS3MDtriKTOr0dSSbjj6dAacbqEe2wuU"
genai.configure(api_key="AIzaSyDyS3MDtriKTOr0dSSbjj6dAacbqEe2wuU")
llm_interface = LLMModelInterface()

app = Flask(__name__)
CORS(app)

# client = MongoClient(MONGO_URI)
# db = client[DB_NAME]
# collection = db["items"]

def store_markdown_to_gdoc(markdown_text, doc_title=None, doc_id=None):
    """
    Stores markdown text in a Google Doc, either creating a new doc or updating an existing one.
    
    Args:
        markdown_text (str): The markdown text to store
        doc_title (str, optional): Title for new document. Required if doc_id is None
        doc_id (str, optional): ID of existing document to update
        
    Returns:
        str: The ID of the created/updated document
    """
    # If you modify these scopes, delete the file token.pickle
    SCOPES = ['https://www.googleapis.com/auth/documents']
    
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
            
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'googledrive.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    # Build the Docs API service
    service = build('docs', 'v1', credentials=creds)
    
    # Convert markdown to HTML
    html_content = markdown.markdown(markdown_text)
    
    if doc_id:
        # Update existing document
        doc = service.documents().get(documentId=doc_id).execute()
        
        # Clear existing content
        requests = [{
            'deleteContentRange': {
                'range': {
                    'startIndex': 1,
                    'endIndex': doc.get('body').get('content')[-1].get('endIndex') - 1
                }
            }
        }]
        
        service.documents().batchUpdate(
            documentId=doc_id,
            body={'requests': requests}
        ).execute()
        
    else:
        # Create new document
        if not doc_title:
            raise ValueError("doc_title is required when creating a new document")
            
        doc = service.documents().create(
            body={'title': doc_title}
        ).execute()
        doc_id = doc.get('documentId')
    
    # Insert the HTML content
    requests = [{
        'insertText': {
            'location': {
                'index': 1,
            },
            'text': markdown_text
        }
    }]
    
    # Apply text styling
    service.documents().batchUpdate(
        documentId=doc_id,
        body={'requests': requests}
    ).execute()
    
    return doc_id


def extract_financial_metrics(sheet_data):
    """Extract financial metrics from sheet data"""
    # Initialize metrics dictionary
    metrics = {
        "total_inventory_cost": 0,
        "potential_revenue": 0,
        "potential_profit": 0,
        "dead_stock": [],
        "profit_margins": [],
        "days_of_supply": [],
        "inventory_summary": {
            "total_profit": 0,
            "total_stock": 0,
            "total_sales": 0,
            "inventory_value": 0
        }
    }
    
    # Process each row in the sheet
    for row in sheet_data:
        try:
            product = row.get("Products", "")
            cost_price = float(row.get("Cost Price", 0))
            selling_price = float(row.get("Sell Price", 0))
            stock_available = int(row.get("Stock", 0))
            monthly_sales = int(row.get("Sales Quantity", 0))
            
            # Calculate individual product metrics
            product_inventory_cost = cost_price * stock_available
            product_potential_revenue = selling_price * stock_available
            product_potential_profit = product_potential_revenue - product_inventory_cost
            profit_margin_percent = ((selling_price - cost_price) / cost_price) * 100
            
            # Add to totals
            metrics["total_inventory_cost"] += product_inventory_cost
            metrics["potential_revenue"] += product_potential_revenue
            metrics["potential_profit"] += product_potential_profit
            
            # Inventory summary
            metrics["inventory_summary"]["total_stock"] += stock_available
            metrics["inventory_summary"]["inventory_value"] += product_inventory_cost
            metrics["inventory_summary"]["total_sales"] += monthly_sales * selling_price
            metrics["inventory_summary"]["total_profit"] += monthly_sales * (selling_price - cost_price)
            
            # Days of supply
            days_of_supply = float('inf') if monthly_sales == 0 else (stock_available / monthly_sales) * 30
            metrics["days_of_supply"].append({
                "product": product,
                "stock": stock_available,
                "days_of_supply": round(days_of_supply, 1)
            })
            
            # Profit margins
            metrics["profit_margins"].append({
                "product": product,
                "margin_percent": round(profit_margin_percent, 2),
                "revenue": round(monthly_sales * selling_price, 2)
            })
            
            # Dead stock analysis (no sales in the last month)
            if monthly_sales == 0 and stock_available > 0:
                metrics["dead_stock"].append({
                    "product": product,
                    "stock": stock_available,
                    "value": round(product_inventory_cost, 2)
                })
            
        except (ValueError, TypeError) as e:
            # Skip rows with invalid data
            continue
    
    # Calculate inventory turnover ratio
    avg_inventory_value = metrics["inventory_summary"]["inventory_value"]
    cogs = metrics["inventory_summary"]["total_sales"] - metrics["inventory_summary"]["total_profit"]
    
    metrics["inventory_turnover_ratio"] = round(cogs / avg_inventory_value, 2) if avg_inventory_value > 0 else 0
    
    # Round financial values for better presentation
    metrics["total_inventory_cost"] = round(metrics["total_inventory_cost"], 2)
    metrics["potential_revenue"] = round(metrics["potential_revenue"], 2)
    metrics["potential_profit"] = round(metrics["potential_profit"], 2)
    metrics["inventory_summary"]["total_profit"] = round(metrics["inventory_summary"]["total_profit"], 2)
    metrics["inventory_summary"]["total_sales"] = round(metrics["inventory_summary"]["total_sales"], 2)
    metrics["inventory_summary"]["inventory_value"] = round(metrics["inventory_summary"]["inventory_value"], 2)
    
    return metrics

def generate_report_with_gemini(financial_metrics):
    """Generate financial report using Gemini API"""
    # Import Gemini API
    import google.generativeai as genai
    
    # Configure the Gemini API (make sure to set up your API key)
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Create prompt for the financial report
    current_month = datetime.datetime.now().strftime("%B %Y")
    
    prompt = f"""
    Generate a comprehensive monthly financial report for {current_month} based on the following metrics:
    
    # Financial Metrics:
    - Total Inventory Cost: ${financial_metrics['total_inventory_cost']}
    - Potential Revenue (if all sold): ${financial_metrics['potential_revenue']}
    - Potential Profit (if all sold): ${financial_metrics['potential_profit']}
    - Inventory Turnover Ratio: {financial_metrics['inventory_turnover_ratio']}
    
    # Dead Stock Analysis:
    {json.dumps(financial_metrics['dead_stock'], indent=2)}
    
    # Profit Margins by Product:
    {json.dumps(financial_metrics['profit_margins'], indent=2)}
    
    # Days of Supply:
    {json.dumps(financial_metrics['days_of_supply'], indent=2)}
    
    # Inventory Summary:
    - Total Profit: ${financial_metrics['inventory_summary']['total_profit']}
    - Total Stock: {financial_metrics['inventory_summary']['total_stock']} units
    - Total Sales: ${financial_metrics['inventory_summary']['total_sales']}
    - Inventory Value: ${financial_metrics['inventory_summary']['inventory_value']}
    
    Please provide:
    1. An executive summary of the financial health
    2. Analysis of key trends this month
    3. Identification of products/categories that are performing well
    4. Identification of underperforming products/categories
    5. Strategic recommendations for next month (inventory adjustments, promotions, etc.)
    6. Specific product recommendations based on the data
    7. Avoid the use of tables in the markdown document, use single column format only
    
    Format the report in Markdown with clear sections, bullet points, and tables where appropriate.
    """
    
    # Generate the report
    response = model.generate_content(prompt)
    
    # Return the generated markdown report
    return response.text

# ...existing code...

# Routes
@app.route("/")
def home():
    return jsonify({"message": "API is running"})

PRODUCT_TO_MODEL_MAP = {
    "Chocolate": "chocolate",
    "Fairy Lights": "fairylight",
    "Protein Shake": "protein",
    "Facewash": "facewash"
}

# List of allowed product names (proper case)
ALLOWED_PRODUCTS = list(PRODUCT_TO_MODEL_MAP.keys())

@app.route('/predict/<product>', methods=['GET'])
def predict(product):
    if product not in ALLOWED_PRODUCTS:
        return jsonify({"error": f"Invalid product name. Allowed products: {', '.join(ALLOWED_PRODUCTS)}"}), 404

    # Get model name from product
    model_name = PRODUCT_TO_MODEL_MAP[product]
    model_path = f"models/{model_name}.pkl"
    data_path = f"data/{model_name}.csv"
    try:
        # Get historical data (last 8 weeks)
        df = pd.read_csv(data_path)
        historical_data = df['y'].tail(8).tolist()
    except Exception as e:
        return jsonify({"error": f"Error loading historical data for {product}: {str(e)}"}), 500

    # Load model and make prediction
    try:
        with open(model_path, 'rb') as f:
            loaded_model = pickle.load(f)
    except Exception as e:
        return jsonify({"error": f"Error loading model for {product}: {str(e)}"}), 500

    # Generate forecast
    future_df = loaded_model.make_future_dataframe(periods=4, freq='W')
    forecast = loaded_model.predict(future_df)
    forecast_last4 = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(4)
    
    # Prepare result with both historical and forecast data
    result = {
        "historical_data": historical_data,
        "forecast": {}
    }
    
    for _, row in forecast_last4.iterrows():
        date_str = row['ds'].strftime('%Y-%m-%d')
        result["forecast"][date_str] = {
            "yhat": float(row['yhat']),
            "yhat_lower": float(row['yhat_lower']),
            "yhat_upper": float(row['yhat_upper'])
        }
    
    return jsonify(result)

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
    
@app.route('/festivals', methods=['GET'])
def get_festivals():
    try:
        festivals_path = os.path.join(os.path.dirname(__file__), "indian_festivals_2025.json")
        goods_path = os.path.join(os.path.dirname(__file__), "festival_goods.json")
        
        if not os.path.exists(festivals_path):
            return jsonify({"error": "Festivals data not found. Run the generator script first."}), 404
            
        with open(festivals_path, 'r') as f:
            festivals_dict = json.load(f)
        
        goods_dict = {}
        if os.path.exists(goods_path):
            with open(goods_path, 'r') as f:
                goods_dict = json.load(f)
        
        response = []
        for date, festival in festivals_dict.items():
            popular_goods = goods_dict.get(festival, [])
            # Only add festival_info if popular_goods is not an empty list
            if popular_goods:  # This checks if the list is non-empty
                festival_info = {
                    "festival": festival,
                    "date": date,
                    "popular_goods": popular_goods
                }
                response.append(festival_info)
        
        return jsonify({"festivals": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def read_google_sheet(sheet_url):
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
        client = gspread.authorize(creds)

        sheet_id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
        if not sheet_id_match:
            return None
        
        sheet_id = sheet_id_match.group(1)
        sheet = client.open_by_key(sheet_id)
        sheet_instance = sheet.get_worksheet(0)
        records_data = sheet_instance.get_all_records()
        records_df = pd.DataFrame.from_dict(records_data)
        
        return records_df.to_json(orient='records')
    except Exception as e:
        return str(e)

@app.route('/read_sheet', methods=['POST'])
def read_sheet():
    data = request.get_json()
    sheet_url = data.get('sheet_url')
    
    if not sheet_url:
        return jsonify({'error': 'Missing sheet_url parameter'}), 400
    
    result = read_google_sheet(sheet_url)
    result = json.loads(result)
    if result is None:
        return jsonify({'error': 'Invalid Google Sheet URL'}), 400
    
    return jsonify({'data': result})

def analyze_inventory(data):
    prompt = """
    Analyze the given product inventory data, to identify the following inferences:
    1. Three products that are high in demand but have relatively low stock.
    2. Three products that are low in demand but have high stock availability.
    
    Return the output data as a structured JSON with two lists:
    - 'high_demand_low_stock': Python list contains three such products.
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
    
    # Extract JSON response
    response = response.text.split("{")[1].split("}")[0]
    response = "{" + response + "}"
    return json.loads(response)

@app.route('/analyze_inventory', methods=['POST'])
def analyze():
    data = request.get_json()
    sheet_url = data.get('sheet_url')
    
    if not sheet_url:
        return jsonify({'error': 'Missing sheet_url parameter'}), 400
    
    result = read_google_sheet(sheet_url)
    result = json.loads(result)
    # print(result)
    if result is None:
        return jsonify({'error': 'Invalid Google Sheet URL'}), 400
    
    result = analyze_inventory(result)
    return jsonify(result)

def authenticate_gsheet():
    creds = Credentials.from_service_account_file("twitter-clone-440006-ed01aaa3bd45.json", scopes=["https://www.googleapis.com/auth/spreadsheets"])
    client = gspread.authorize(creds)
    return client

def get_sheet(client, sheet_url):
    return client.open_by_url(sheet_url).sheet1

def find_existing_product(sheet, product_name):
    records = sheet.get_all_records()
    existing_entries = []
    for i, row in enumerate(records, start=2):  # Start from row index 2 (1-based index)
        if row['Products'].strip().lower() == product_name.strip().lower():
            existing_entries.append((i, row))
    return existing_entries

def add_product(sheet, product_data):
    product_name = product_data['product_name'].strip()
    existing_entries = find_existing_product(sheet, product_name)
    today_date = datetime.datetime.today().strftime('%m-%d-%Y')
    
    if existing_entries:
        latest_entry = existing_entries[-1]  # Get the most recent previous entry
        latest_row_index = latest_entry[0]
        latest_data = latest_entry[1]
        
        previous_stock = latest_data['Stock']
        stock_to_add = product_data.get('stock_to_add', 0)
        new_stock = previous_stock + stock_to_add
        
        sell_price = product_data.get('sell_price', latest_data['Sell Price'])
        low_threshold = product_data.get('low_threshold', latest_data['Low Threshold'])
        high_threshold = product_data.get('high_threshold', latest_data['High Threshold'])
        
        # Update the sheet with new values
        sheet.update_cell(latest_row_index, 2, today_date)  # Update Date to today's date
        sheet.update_cell(latest_row_index, 4, new_stock)  # Update Stock
        sheet.update_cell(latest_row_index, 6, sell_price)  # Update Selling Price if changed
        sheet.update_cell(latest_row_index, 9, low_threshold)  # Update Low Threshold
        sheet.update_cell(latest_row_index, 10, high_threshold)  # Update High Threshold
        
        return {"message": "Product updated successfully", "product": product_name, "new_stock": new_stock}
    else:
        expiry_days = product_data.get('expiry_days', 0)
        stock_to_add = product_data.get('stock_to_add', 0)
        cost_price = product_data.get('cost_price', 0.0)
        sell_price = product_data.get('sell_price', 0.0)
        low_threshold = product_data.get('low_threshold', 0)
        high_threshold = product_data.get('high_threshold', 0)
        
        new_entry = [
            product_name, today_date, expiry_days, stock_to_add, cost_price, sell_price, 0, 0, low_threshold, high_threshold
        ]
        sheet.append_row(new_entry)
        return {"message": "New product added successfully", "product": product_name}

@app.route('/inventory/add', methods=['POST'])
def inventory_add():
    # Get JSON data from request
    product_data = request.json
    
    if not product_data:
        return jsonify({"error": "Missing request data"}), 400
    
    if 'product_name' not in product_data:
        return jsonify({"error": "Missing product name"}), 400
        
    if 'sheet_url' not in product_data:
        return jsonify({"error": "Missing sheet URL"}), 400
    
    sheet_url = product_data.pop('sheet_url')  # Extract and remove sheet_url from product_data
    
    try:
        client = authenticate_gsheet()
        sheet = get_sheet(client, sheet_url)
        
        result = add_product(sheet, product_data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Google Sheets Setup
SHEET_URL = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"

# Authenticate Google Sheets API
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
client = gspread.authorize(creds)
sheet = client.open_by_url(SHEET_URL).sheet1  # Open first sheet

# Function to get products from Google Sheets
def get_products():
    data = sheet.get_all_records()
    products = []
    for i, row in enumerate(data, start=2):  # Start from row 2 (headers at row 1)
        product_name = row.get("Products", "").strip()
        stock = row.get("Stock", 0)
        if product_name:
            products.append({
                'id': i,
                'name': product_name,
                'stock': stock,
                'sell_price': float(sheet.cell(i, 6).value),
                'cost_price': float(sheet.cell(i, 5).value),
            })
    return products

# API to fetch available products
@app.route('/api/products', methods=['GET'])
def get_products_api():
    products = get_products()
    return jsonify(products)

# API to handle product purchase
@app.route('/api/buy_product', methods=['POST'])
def buy_product_api():
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id or quantity <= 0:
        return jsonify({"error": "Invalid product or quantity"}), 400

    # Fetch the product from Google Sheets
    product = None
    for p in get_products():
        if p['id'] == product_id:
            product = p
            break

    if not product:
        return jsonify({"error": "Product not found"}), 404

    if quantity > product['stock']:
        return jsonify({"error": f"Cannot buy more than {product['stock']} units"}), 400

    # Calculate profit
    profit = (product['sell_price'] - product['cost_price']) * quantity
    new_stock = product['stock'] - quantity

    # Update stock and sales in the sheet
    sheet.update_cell(product_id, 4, new_stock)  # Update stock in column 4
    sheet.update_cell(product_id, 7, quantity)   # Update sales quantity in column 7
    sheet.update_cell(product_id, 8, profit)     # Update profit in column 8

    return jsonify({
        "message": f"{product['name']} updated! {quantity} units bought. New Stock: {new_stock}. Profit: {profit:.2f}",
        "new_stock": new_stock,
        "profit": profit,
    })

@app.route("/generate-financial-report", methods=["POST"])
def generate_financial_report():
    try:
        # Get the sheet data
        data = request.get_json()
        sheet_url = data.get('sheet_url')
        
        if not sheet_url:
            return jsonify({'error': 'Missing sheet_url parameter'}), 400
        
        result = read_google_sheet(sheet_url)
        sheet_data = json.loads(result)

        
        if not sheet_data:
            return jsonify({"error": "Failed to fetch sheet data"}), 500
        
        # Extract financial metrics
        financial_metrics = extract_financial_metrics(sheet_data)
        
        # Generate report using Gemini
        report = generate_report_with_gemini(financial_metrics)
        store_markdown_to_gdoc(report, doc_title="Monthly Report")
        
        return jsonify({
            "success": True,
            "report": report
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500




# Add this function to handle Google Sheet transactions between warehouse and store
@app.route('/transfer_product', methods=['POST'])
def transfer_product():
    try:
        data = request.get_json()
        
        # Required parameters
        product_name = data.get('product_name')
        quantity = int(data.get('quantity', 0))
        warehouse_sheet_url = data.get('warehouse_sheet_url', '')
        store_sheet_url = data.get('store_sheet_url', '')
        
        # Validation
        if not all([product_name, quantity > 0, warehouse_sheet_url, store_sheet_url]):
            return jsonify({
                'success': False,
                'error': 'Missing required parameters. Need product_name, quantity, warehouse_sheet_url, and store_sheet_url'
            }), 400
            
        # Set up Google Sheets authentication
        scope = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
        client = gspread.authorize(creds)
        
        # Open both spreadsheets
        try:
            source_sheet = client.open_by_url(warehouse_sheet_url).sheet1
            target_sheet = client.open_by_url(store_sheet_url).sheet1
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to open spreadsheets: {str(e)}'
            }), 400
        
        # 1. Check if product exists in warehouse and has enough stock
        warehouse_products = source_sheet.get_all_records()
        product_found = False
        source_row_index = None
        current_stock = 0
        
        for i, row in enumerate(warehouse_products, start=2):
            if row['Products'].strip().lower() == product_name.strip().lower():
                product_found = True
                source_row_index = i
                current_stock = row['Stock']
                
                # Check if enough stock is available
                if current_stock < quantity:
                    return jsonify({
                        'success': False,
                        'error': f'Not enough stock available. Requested: {quantity}, Available: {current_stock}'
                    }), 400
                
                # Get product details for potential new row in store
                product_details = row
                break
        
        if not product_found:
            return jsonify({
                'success': False,
                'error': f'Product "{product_name}" not found in warehouse sheet'
            }), 404
        
        # 2. Update warehouse stock (deduct)
        new_warehouse_stock = current_stock - quantity
        source_sheet.update_cell(source_row_index, 4, new_warehouse_stock)  # Stock is in column 4
        
        # 3. Check if product exists in store
        store_products = target_sheet.get_all_records()
        product_in_store = False
        target_row_index = None
        
        for i, row in enumerate(store_products, start=2):
            if row['Products'].strip().lower() == product_name.strip().lower():
                product_in_store = True
                target_row_index = i
                store_current_stock = row['Stock']
                break
        
        # 4. Update or add product in store
        current_time = datetime.datetime.now().strftime("%m-%d-%Y")
        
        if product_in_store:
            # Update existing product stock
            new_store_stock = store_current_stock + quantity
            target_sheet.update_cell(target_row_index, 4, new_store_stock)  # Stock is column 4
            target_sheet.update_cell(target_row_index, 2, current_time)     # Update date in column 2
        else:
            # Add new product row
            new_row = [
                product_name,                                    # Product name
                current_time,                                    # Date
                product_details.get('Expiry Days', 30),          # Expiry Days
                quantity,                                        # Stock
                product_details.get('Cost Price', 500),          # Cost Price
                product_details.get('Sell Price', 1500),         # Sell Price
                0,                                               # Sales Quantity
                0,                                               # Profit
                product_details.get('Low Threshold', 10),        # Low Threshold
                product_details.get('High Threshold', 50)        # High Threshold
            ]
            target_sheet.append_row(new_row)
        
        return jsonify({
            'success': True,
            'message': f'Successfully transferred {quantity} units of "{product_name}" from warehouse to store',
            'new_warehouse_stock': new_warehouse_stock,
            'transaction_date': current_time
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing transaction: {str(e)}'
        }), 500

# Add this endpoint to load product list from a sheet
@app.route('/list_products', methods=['POST'])
def list_products():
    try:
        data = request.get_json()
        sheet_url = data.get('sheet_url')
        
        if not sheet_url:
            return jsonify({
                'success': False,
                'error': 'Missing sheet_url parameter'
            }), 400
            
        # Set up Google Sheets authentication
        scope = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
        client = gspread.authorize(creds)
        
        # Open the spreadsheet
        try:
            sheet = client.open_by_url(sheet_url).sheet1
            products = sheet.get_all_records()
            
            # Format products for frontend
            formatted_products = []
            for index, product in enumerate(products):
                formatted_products.append({
                    'id': index + 1,
                    'name': product['Products'],
                    'quantity': product['Stock'],
                    'price': product.get('Sell Price', 0),
                    'cost': product.get('Cost Price', 0),
                    'expiry': product.get('Expiry Days', 0)
                })
                
            return jsonify({
                'success': True,
                'products': formatted_products
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to access spreadsheet: {str(e)}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing request: {str(e)}'
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)