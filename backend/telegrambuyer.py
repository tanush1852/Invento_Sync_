import requests
import re
import time
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
from dotenv import load_dotenv
import os
load_dotenv()

# ✅ Telegram Bot Credentials
BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")

# ✅ Google Sheets Setup"h
SHEET_URL = os.getenv("SHEET_URL")

# ✅ Authenticate Google Sheets API
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
client = gspread.authorize(creds)
sheet = client.open_by_url(SHEET_URL).sheet1  # Open first sheet

# ✅ Function to send messages via Telegram
def send_telegram_message(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": text}
    requests.post(url, json=payload)

# ✅ Function to send spreadsheet link via Telegram
def send_spreadsheet_link():
    message = f"📊 Spreadsheet link: {SHEET_URL}"
    send_telegram_message(message)
    print("✅ Spreadsheet link sent via Telegram.")

# ✅ Function to update product stock
def update_stock(product_name, quantity):
    try:
        data = sheet.get_all_records()
        if not data:
            send_telegram_message("❌ Spreadsheet is empty or headers are missing.")
            return
        
        found = False

        for i, row in enumerate(data, start=2):  # Start from row 2 (headers at row 1)
            if row.get("Products", "").strip().lower() == product_name:
                current_stock = int(row.get("Stock", 0))
                new_quantity = current_stock + quantity
                sheet.update_cell(i, 4, new_quantity)  # Update stock in 4th column
                send_telegram_message(f"✅ Stock updated: {product_name} now has {new_quantity}.")
                found = True
                break

        if not found:
            # If product is not found, ask for all other details
            send_telegram_message(f"❓ Product '{product_name}' not found. Please provide the following details:")

            # Ask for expiry days, cost price, sell price, low threshold, high threshold
            send_telegram_message("1️⃣ Expiry Days (e.g., 30)")
            send_telegram_message("2️⃣ Cost Price (e.g., 50.00)")
            send_telegram_message("3️⃣ Sell Price (e.g., 80.00)")
            send_telegram_message("4️⃣ Low Threshold (e.g., 5)")
            send_telegram_message("5️⃣ High Threshold (e.g., 100)")

            # Wait for responses (gather them one by one)
            responses = gather_responses()

            if len(responses) == 5:
                expiry_days, cost_price, sell_price, low_threshold, high_threshold = responses
                
                # Get today's date in MM-DD-YYYY format
                current_date = datetime.today().strftime('%m-%d-%Y')

                # Append new product to the sheet
                sheet.append_row([product_name, current_date, expiry_days, quantity, cost_price, sell_price, 0, 0, low_threshold, high_threshold])

                send_telegram_message(f"✅ New product added: {product_name} with {quantity} stock, expiry in {expiry_days} days, cost price {cost_price}, sell price {sell_price}, low threshold {low_threshold}, high threshold {high_threshold}.")
            else:
                send_telegram_message("❌ Failed to get all required details for new product. Please try again.")

    except Exception as e:
        send_telegram_message(f"❌ Error updating stock: {e}")

# ✅ Function to gather responses from the user
def gather_responses():
    responses = []

    # Request each required input
    responses.append(wait_for_response("Please provide Expiry Days:"))
    responses.append(wait_for_response("Please provide Cost Price:"))
    responses.append(wait_for_response("Please provide Sell Price:"))
    responses.append(wait_for_response("Please provide Low Threshold:"))
    responses.append(wait_for_response("Please provide High Threshold:"))

    return responses

# ✅ Function to wait for a single response and return it
def wait_for_response(prompt_message):
    send_telegram_message(prompt_message)
    while True:
        messages = get_latest_messages()
        for message in messages:
            response = message.strip()
            if response:
                send_telegram_message(f"✅ Received: {response}")
                return response  # Return the response when valid
            else:
                send_telegram_message("❌ Please enter a valid response.")

# ✅ Get only new messages from Telegram chat
last_update_id = 0  # Store last processed update ID

def get_latest_messages():
    global last_update_id
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={last_update_id+1}"
    response = requests.get(url).json()
    
    messages = []
    if "result" in response:
        for update in response["result"]:
            if "message" in update and "text" in update["message"]:
                chat_id = update["message"]["chat"]["id"]
                if str(chat_id) == CHAT_ID:  # Ensure message is from the correct chat
                    messages.append(update["message"]["text"].strip())
                    last_update_id = update["update_id"]  # Update last processed ID
    
    return messages

# ✅ Main loop to monitor messages
print(f"🚀 Monitoring Telegram chat: {CHAT_ID}... Press Ctrl+C to stop.")

try:
    while True:
        messages = get_latest_messages()
        for message in messages:
            if "check" in message.lower():
                send_spreadsheet_link()

            # ✅ Detect "add product quantity" format (supports multi-word product names)
            match = re.match(r"add (.+) (\d+)", message)
            if match:
                product = match.group(1).strip()
                quantity = int(match.group(2))
                update_stock(product, quantity)

        time.sleep(5)  # Refresh every 5 seconds

except KeyboardInterrupt:
    print("\n🚀 Monitoring stopped.")
