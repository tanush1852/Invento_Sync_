from flask import Flask, jsonify, request
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes



# ✅ Google Sheets Setup
SHEET_URL = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"

# ✅ Authenticate Google Sheets API
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
client = gspread.authorize(creds)
sheet = client.open_by_url(SHEET_URL).sheet1  # Open first sheet

# ✅ Function to get products from Google Sheets
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

# ✅ API to fetch available products
@app.route('/api/products', methods=['GET'])
def get_products_api():
    products = get_products()
    return jsonify(products)

# ✅ API to handle product purchase
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

if __name__ == "__main__":
    app.run(debug=True)
