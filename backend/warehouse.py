import gspread
from oauth2client.service_account import ServiceAccountCredentials
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define the scope of the credentials
scope = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]

# Set up the credentials
try:
    creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
    client = gspread.authorize(creds)
    print("Google Sheets authentication successful!")
except Exception as e:
    print("Failed to authenticate Google Sheets:", e)
    exit(1)

# Define your warehouses and their dedicated target stores
warehouse_store_mapping = {
    "warehouse1": {
        "source_url": "https://docs.google.com/spreadsheets/d/1ZMK_TWm6HGPK2REJ007Sm-DDwglKZmIMPBN4EUWHMaw/edit?usp=sharing",
        "target_url": "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
    },
    "warehouse2": {
        "source_url": "https://docs.google.com/spreadsheets/d/1EiP1RMndWj9IG1tMVc9hC1z2wC8_hdYI0dir90Wu_S8/edit?usp=sharing",
        "target_url": "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
    }
}

@app.route('/api/warehouses', methods=['GET'])
def get_warehouses():
    return jsonify({"warehouses": list(warehouse_store_mapping.keys())})

@app.route('/api/products/<warehouse_id>', methods=['GET'])
def get_products(warehouse_id):
    if warehouse_id not in warehouse_store_mapping:
        return jsonify({"error": "Warehouse not found"}), 404
    
    try:
        source_url = warehouse_store_mapping[warehouse_id]["source_url"]
        print(f"Fetching products from {source_url}")  # Debug log

        source_sheet = client.open_by_url(source_url).sheet1
        product_data = source_sheet.get_all_records()
        print(f"Fetched {len(product_data)} products")  # Debug log

        return jsonify(product_data)
    except Exception as e:
        print(f"Error fetching products for {warehouse_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/transfer', methods=['POST'])
def transfer_product():
    data = request.json
    warehouse_id = data.get('warehouseId')
    product_name = data.get('productName')
    quantity = data.get('quantity')

    if not all([warehouse_id, product_name, quantity]):
        return jsonify({"error": "Missing required fields"}), 400

    if warehouse_id not in warehouse_store_mapping:
        return jsonify({"error": "Warehouse not found"}), 404

    try:
        source_url = warehouse_store_mapping[warehouse_id]["source_url"]
        target_url = warehouse_store_mapping[warehouse_id]["target_url"]

        print(f"Transferring from {source_url} to {target_url}")  # Debug log

        source_sheet = client.open_by_url(source_url).sheet1
        target_sheet = client.open_by_url(target_url).sheet1

        source_data = source_sheet.get_all_records()

        # Check if 'Products' and 'Stock' columns exist
        if not source_data or 'Products' not in source_data[0] or 'Stock' not in source_data[0]:
            return jsonify({"error": "Invalid sheet format. Missing 'Products' or 'Stock' columns"}), 500

        product_found = False
        product_row = 0

        for i, row in enumerate(source_data, start=2):
            if row['Products'].strip().lower() == product_name.strip().lower():
                product_found = True
                product_row = i
                if row['Stock'] < quantity:
                    return jsonify({"error": f"Not enough stock. Available: {row['Stock']}"}), 400
                break

        if not product_found:
            return jsonify({"error": "Product not found in warehouse"}), 404

        # Deduct stock from the source warehouse
        new_source_stock = source_data[product_row-2]['Stock'] - quantity
        source_sheet.update_cell(product_row, 2, new_source_stock)

        # Add stock to the target store
        current_time = datetime.datetime.now().strftime("%m-%d-%Y")
        target_data = target_sheet.get_all_records()
        target_found = False

        for i, row in enumerate(target_data, start=2):
            if row['Products'].strip().lower() == product_name.strip().lower():
                new_target_stock = row['Stock'] + quantity
                target_sheet.update_cell(i, 4, new_target_stock)
                target_sheet.update_cell(i, 2, current_time)
                target_found = True
                break

        if not target_found:
            expiry_day = 20
            cost_price = 500
            selling_price = 1500

            source_product = next((p for p in source_data if p['Products'].strip().lower() == product_name.strip().lower()), None)

            if source_product:
                expiry_day = source_product.get('Expiry Day', expiry_day)
                cost_price = source_product.get('Cost Price', cost_price)
                selling_price = source_product.get('Selling Price', selling_price)

            target_sheet.append_row([
                product_name.strip().lower(),
                current_time,
                expiry_day,
                quantity,
                cost_price,
                selling_price,
                0,
                0,
                10,
                50
            ] + [0] * (len(target_sheet.row_values(1)) - 10))

        return jsonify({
            "success": True,
            "message": f"Transferred {quantity} units of {product_name} from {warehouse_id}",
            "newStock": new_source_stock,
            "targetStore": warehouse_id + "_store"
        })

    except Exception as e:
        print(f"Error in transfer: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
