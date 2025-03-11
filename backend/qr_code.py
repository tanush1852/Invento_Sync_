# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Google Sheets connection details
SHEET_URL = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
CREDENTIALS_FILE = "twitter-clone-440006-ed01aaa3bd45.json"  # Your credentials file

# Cache for sheet data to reduce API calls
sheet_cache = None
last_fetch_time = 0
CACHE_DURATION = 60  # Cache duration in seconds

def connect_to_sheet():
    """Connect to Google Sheets using gspread"""
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
    client = gspread.authorize(creds)
    return client.open_by_url(SHEET_URL).sheet1

def get_sheet_data(force_refresh=False):
    """Get data from Google Sheet with caching"""
    global sheet_cache, last_fetch_time
    
    import time
    current_time = time.time()
    
    # Check if we need to refresh the cache
    if force_refresh or sheet_cache is None or (current_time - last_fetch_time) > CACHE_DURATION:
        try:
            sheet = connect_to_sheet()
            all_values = sheet.get_all_values()
            
            # First row contains headers
            headers = [h.lower().replace(' ', '') for h in all_values[0]]
            
            # Convert remaining rows to list of dictionaries
            products = []
            for i, row in enumerate(all_values[1:], start=1):
                product = {'id': str(i)}
                for j, value in enumerate(row):
                    if j < len(headers):
                        # Convert numeric values
                        if headers[j] in ['expirydays', 'stock', 'costprice', 'sellprice', 
                                          'salesquantity', 'profit', 'lowthreshold', 'highthreshold']:
                            try:
                                product[headers[j]] = float(value) if '.' in value else int(value)
                            except ValueError:
                                product[headers[j]] = 0
                        else:
                            product[headers[j]] = value
                
                # Convert to camelCase for frontend consistency
                product_formatted = {}
                for key, value in product.items():
                    if key == 'id':
                        product_formatted['id'] = value
                    elif key == 'products':
                        product_formatted['product'] = value
                    elif key == 'expirydays':
                        product_formatted['expiryDays'] = value
                    elif key == 'costprice':
                        product_formatted['costPrice'] = value
                    elif key == 'sellprice':
                        product_formatted['sellPrice'] = value
                    elif key == 'salesquantity':
                        product_formatted['salesQuantity'] = value
                    elif key == 'lowthreshold':
                        product_formatted['lowThreshold'] = value
                    elif key == 'highthreshold':
                        product_formatted['highThreshold'] = value
                    else:
                        product_formatted[key] = value
                
                products.append(product_formatted)
            
            sheet_cache = products
            last_fetch_time = current_time
        except Exception as e:
            print(f"Error fetching sheet data: {e}")
            if sheet_cache is None:
                # If we have no cache, return empty list
                return []
            # Use cached data if available
    
    return sheet_cache

def update_sheet_after_purchase(product_id, quantity):
    """Update the Google Sheet after a purchase"""
    try:
        # Get current products data
        products = get_sheet_data(force_refresh=True)
        
        # Find the product
        product_index = -1
        for i, product in enumerate(products):
            if product['id'] == product_id:
                product_index = i
                break
                
        if product_index == -1:
            return False, "Product not found"
            
        product = products[product_index]
        
        # Check if we have enough stock
        if product['stock'] < quantity:
            return False, f"Not enough stock. Only {product['stock']} available."
            
        # Calculate new values
        new_stock = product['stock'] - quantity
        new_sales_quantity = product['salesQuantity'] + quantity
        new_profit = product['profit'] + ((product['sellPrice'] - product['costPrice']) * quantity)
        
        # Get the actual row in the spreadsheet (add 2 because of header row and 0-indexing)
        row_num = int(product_id) + 1
        
        # Update the Google Sheet
        sheet = connect_to_sheet()
        
        # Update stock (column D)
        sheet.update_cell(row_num, 4, new_stock)
        
        # Update sales quantity (column G)
        sheet.update_cell(row_num, 7, new_sales_quantity)
        
        # Update profit (column H)
        sheet.update_cell(row_num, 8, new_profit)
        
        # Update our product object with new values
        product['stock'] = new_stock
        product['salesQuantity'] = new_sales_quantity
        product['profit'] = new_profit
        
        # Update the cache
        sheet_cache[product_index] = product
        
        return True, product
        
    except Exception as e:
        print(f"Error updating sheet: {e}")
        return False, str(e)

@app.route('/api/products', methods=['GET'])
def get_products():
    """API endpoint to get all products"""
    products = get_sheet_data()
    return jsonify(products)

@app.route('/api/purchase', methods=['POST'])
def purchase_product():
    """API endpoint to process a purchase"""
    try:
        data = request.json
        product_id = data.get('productId')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return jsonify({'success': False, 'message': 'Product ID is required'})
            
        success, result = update_sheet_after_purchase(product_id, quantity)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Successfully purchased {quantity} units',
                'product': result
            })
        else:
            return jsonify({
                'success': False,
                'message': result
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)