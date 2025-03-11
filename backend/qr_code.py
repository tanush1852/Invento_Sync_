import os
import json
import qrcode
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import io
from flask import Flask, request, jsonify, render_template_string
import base64
from flask_cors import CORS  # You'll need to install this: pip install flask-cors
from dotenv import load_dotenv
import os
load_dotenv()
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
SHEET_URL = os.getenv("SHEET_URL")
CREDENTIALS_FILE = "twitter-clone-440006-ed01aaa3bd45.json"
SHEET_ID = SHEET_URL.split('/d/')[1].split('/edit')[0]
RANGE_NAME = "Sheet1!A1:K"  # Assuming data is in Sheet1

# Functions to interact with Google Sheets
def get_sheets_service():
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scopes)
    service = build('sheets', 'v4', credentials=credentials)
    return service

def get_products_data():
    service = get_sheets_service()
    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=SHEET_ID, range=RANGE_NAME).execute()
    values = result.get('values', [])
    
    if not values:
        return []
    
    # Convert to list of dictionaries
    headers = values[0]
    products = []
    for row in values[1:]:  # Skip header row
        product = {}
        for i, value in enumerate(row):
            if i < len(headers):
                product[headers[i]] = value
        products.append(product)
    
    return products

def update_product_data(product_name, quantity_purchased):
    service = get_sheets_service()
    sheet = service.spreadsheets()
    
    # Get current data
    result = sheet.values().get(spreadsheetId=SHEET_ID, range=RANGE_NAME).execute()
    values = result.get('values', [])
    
    if not values:
        return False
    
    headers = values[0]
    product_idx = None
    stock_idx = headers.index('Stock')
    sales_qty_idx = headers.index('Sales Quantity')
    profit_idx = headers.index('Profit')
    cost_price_idx = headers.index('Cost Price')
    sell_price_idx = headers.index('Sell Price')
    
    # Find the product row
    for i, row in enumerate(values[1:], 1):  # Skip header, start index at 1
        if row[0] == product_name:
            product_idx = i
            break
    
    if product_idx is None:
        return False
    
    # Update values
    current_stock = int(values[product_idx][stock_idx])
    current_sales = int(values[product_idx][sales_qty_idx])
    cost_price = int(values[product_idx][cost_price_idx])
    sell_price = int(values[product_idx][sell_price_idx])
    
    new_stock = current_stock - quantity_purchased
    new_sales = current_sales + quantity_purchased
    new_profit = (sell_price - cost_price) * new_sales
    
    # Prepare update requests
    requests = [
        {
            'range': f'Sheet1!D{product_idx+1}',  # Stock column (D)
            'values': [[new_stock]]
        },
        {
            'range': f'Sheet1!G{product_idx+1}',  # Sales Quantity column (G)
            'values': [[new_sales]]
        },
        {
            'range': f'Sheet1!H{product_idx+1}',  # Profit column (H)
            'values': [[new_profit]]
        }
    ]
    
    # Execute batch update
    batch_update_values_request_body = {
        'value_input_option': 'RAW',
        'data': requests
    }
    
    response = service.spreadsheets().values().batchUpdate(
        spreadsheetId=SHEET_ID,
        body=batch_update_values_request_body
    ).execute()
    
    return True

# QR Code Generation
def generate_qr_codes():
    products = get_products_data()
    os.makedirs('qr_codes', exist_ok=True)
    
    qr_data = {}
    for product in products:
        product_name = product['Products']
        purchase_url = f"http://192.168.1.4:5000/scan/{product_name}"  # Change IP as needed

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(purchase_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        file_path = f"qr_codes/{product_name}.png"
        img.save(file_path)

        # Convert to Base64 for frontend display
        buffered = io.BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()

        qr_data[product_name] = {
            'image': img_str,
            'url': purchase_url  # Add the purchase URL
        }

    return qr_data

# API Routes for frontend integration
@app.route('/api/products', methods=['GET'])
def get_products():
    qr_data = generate_qr_codes()
    products = get_products_data()
    
    return jsonify({
        'products': products,
        'qr_data': qr_data
    })

@app.route('/purchase/<product_name>', methods=['GET', 'POST'])
def purchase(product_name):
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        quantity = int(data.get('quantity', 1))
        success = update_product_data(product_name, quantity)
        
        if success:
            return jsonify({'status': 'success', 'message': f'Successfully purchased {quantity} of {product_name}'})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to update inventory'})

# Keep the original routes for HTML rendering
@app.route('/')
def index():
    qr_data = generate_qr_codes()
    products = get_products_data()
    
    # Original HTML template
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Inventory QR Code System</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .product-container { display: flex; flex-wrap: wrap; }
            .product-card { 
                border: 1px solid #ddd; 
                border-radius: 8px; 
                padding: 15px; 
                margin: 10px; 
                width: 300px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .qr-code { text-align: center; margin-bottom: 15px; }
            .qr-code img { max-width: 200px; }
            .product-info { margin-top: 10px; }
            h1, h2 { color: #333; }
            .product-info p { margin: 5px 0; }
            .low-stock { color: red; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Inventory QR Code System</h1>
        
        <div class="product-container">
            {% for product in products %}
            <div class="product-card">
                <h2>{{ product["Products"] }}</h2>
                <div class="qr-code">
                    <img src="data:image/png;base64,{{ qr_data[product["Products"]]["image"] }}" alt="QR Code">
                </div>
                <div class="product-info">
                    <p>Price: {{ product["Sell Price"] }}</p>
                    <p {% if product["Stock"]|int < 100 %}class="low-stock"{% endif %}>
                        Stock: {{ product["Stock"] }}
                    </p>
                    <p>Expiry Days: {{ product["Expiry Days"] }}</p>
                </div>
            </div>
            {% endfor %}
        </div>
    </body>
    </html>
    '''
    
    return render_template_string(html, products=products, qr_data=qr_data)

@app.route('/inventory')
def inventory():
    products = get_products_data()
    
    # Original HTML template
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Inventory Status</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            tr:hover { background-color: #f5f5f5; }
            .low-stock { color: red; font-weight: bold; }
            .expired { background-color: #ffdddd; }
        </style>
    </head>
    <body>
        <h1>Inventory Status</h1>
        
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Sales</th>
                    <th>Profit</th>
                    <th>Expiry Days</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {% for product in products %}
                <tr {% if product["Expiry Days"]|int < 30 %}class="expired"{% endif %}>
                    <td>{{ product["Products"] }}</td>
                    <td {% if product["Stock"]|int < 100 %}class="low-stock"{% endif %}>
                        {{ product["Stock"] }}
                    </td>
                    <td>{{ product["Sales Quantity"] }}</td>
                    <td>{{ product["Profit"] }}</td>
                    <td>{{ product["Expiry Days"] }}</td>
                    <td>
                        {% if product["Stock"]|int < product["Low Threshold"]|int %}
                        <span class="low-stock">Low Stock</span>
                        {% elif product["Stock"]|int > product["High Threshold"]|int %}
                        <span>Overstocked</span>
                        {% else %}
                        <span>Normal</span>
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </body>
    </html>
    '''
    
    return render_template_string(html, products=products)
@app.route('/scan/<product_name>', methods=['GET'])
def scan_qr(product_name):
    return render_template_string('''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Purchase</title>
        <link rel="stylesheet" 
              href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <script>
            function purchaseProduct() {
                let quantity = document.getElementById("quantity").value;
                if (quantity <= 0) {
                    alert("Please enter a valid quantity.");
                    return;
                }
                fetch("/purchase/{{ product_name }}", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ quantity: quantity })
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    window.location.href = "/";
                })
                .catch(error => console.error("Error:", error));
            }
        </script>
        <style>
            body {
                background-color: #f8f9fa;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .card {
                max-width: 400px;
                padding: 20px;
                box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
            }
            .btn-primary {
                width: 100%;
            }
            .btn-secondary {
                width: 100%;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="card text-center">
            <h2 class="mb-3">Confirm Purchase</h2>
            <p>Enter quantity for <b>{{ product_name }}</b>:</p>
            <input type="number" id="quantity" class="form-control" min="1" value="1">
            <button class="btn btn-primary mt-3" onclick="purchaseProduct()">Confirm Purchase</button>
            <a href="/" class="btn btn-secondary">Cancel</a>
        </div>
    </body>
    </html>
    ''', product_name=product_name)

if __name__ == '__main__':
    # Generate QR codes on startup
    generate_qr_codes()
    app.run(debug=True, host='0.0.0.0', port=5000)