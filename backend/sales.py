from google.oauth2.service_account import Credentials
import gspread
import datetime

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

def add_product(sheet, product_name):
    existing_entries = find_existing_product(sheet, product_name)
    today_date = datetime.datetime.today().strftime('%m-%d-%Y')
    
    if existing_entries:
        print("Existing product found. Checking existing stocks...")
        latest_entry = existing_entries[-1]  # Get the most recent previous entry
        latest_row_index = latest_entry[0]
        latest_data = latest_entry[1]
        
        previous_stock = latest_data['Stock'] - latest_data['Sales Quantity']
        print(f"Previous stock available: {previous_stock}")
        
        stock_to_add = int(input("Enter additional stock quantity needed: "))
        new_stock = previous_stock + stock_to_add
        
        change_price = input("Do you want to change the selling price? (yes/no): ").strip().lower()
        sell_price = float(input("Enter new selling price: ")) if change_price == 'yes' else latest_data['Sell Price']
        
        update_threshold = input("Do you want to update stock thresholds? (yes/no): ").strip().lower()
        if update_threshold == 'yes':
            low_threshold = int(input("Enter new low stock threshold: "))
            high_threshold = int(input("Enter new high stock threshold: "))
        else:
            low_threshold = latest_data['Low Threshold']
            high_threshold = latest_data['High Threshold']
        
        # Update the sheet with new values
        sheet.update_cell(latest_row_index, 2, today_date)  # Update Date to today's date
        sheet.update_cell(latest_row_index, 4, new_stock)  # Update Stock
        sheet.update_cell(latest_row_index, 6, sell_price)  # Update Selling Price if changed
        sheet.update_cell(latest_row_index, 9, low_threshold)  # Update Low Threshold
        sheet.update_cell(latest_row_index, 10, high_threshold)  # Update High Threshold
        
        print("Product updated successfully.")
    else:
        expiry_days = int(input("Enter expiry days: "))
        stock_to_add = int(input("Enter stock quantity to add: "))
        cost_price = float(input("Enter cost price: "))
        sell_price = float(input("Enter selling price: "))
        low_threshold = int(input("Enter low stock threshold: "))
        high_threshold = int(input("Enter high stock threshold: "))
        
        new_entry = [
            product_name, today_date, expiry_days, stock_to_add, cost_price, sell_price, 0, 0, low_threshold, high_threshold
        ]
        sheet.append_row(new_entry)
        print("New product added successfully.")

if __name__ == "__main__":
    SHEET_URL = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
    client = authenticate_gsheet()
    sheet = get_sheet(client, SHEET_URL)
    
    product_name = input("Enter product name: ").strip()
    add_product(sheet, product_name)



from flask import Flask, request, jsonify
from google.oauth2.service_account import Credentials
import gspread
import datetime

app = Flask(__name__)

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
        
        previous_stock = latest_data['Stock'] - latest_data['Sales Quantity']
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
    
    if not product_data or 'product_name' not in product_data:
        return jsonify({"error": "Missing product name"}), 400
    
    try:
        SHEET_URL = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
        client = authenticate_gsheet()
        sheet = get_sheet(client, SHEET_URL)
        
        result = add_product(sheet, product_data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)