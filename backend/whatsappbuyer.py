from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import smtplib
from email.message import EmailMessage
import os
import re
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv
import os
load_dotenv()

# ✅ Google Sheets Setup
SHEET_URL = os.getenv("SHEET_URL")

# ✅ Email settings
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_RECEIVER = "tanush1852@gmail.com"

# ✅ Authenticate Google Sheets API
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_name("twitter-clone-440006-ed01aaa3bd45.json", scope)
client = gspread.authorize(creds)
sheet = client.open_by_url(SHEET_URL).sheet1  # Opens first sheet

# ✅ Chrome Options to Fix SSL Handshake Issues
options = Options()
options.add_argument("--ignore-certificate-errors")
options.add_argument("--ignore-ssl-errors=yes")
options.add_argument("--disable-features=SSLVersionMax")
options.add_argument("--allow-insecure-localhost")
options.add_argument("--disable-extensions")
options.add_argument("--incognito")

# ✅ Automatically fetch latest ChromeDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

# ✅ Open WhatsApp Web
driver.get("https://web.whatsapp.com/")
print("Please scan the QR code in WhatsApp Web...")

while True:
    try:
        driver.find_element(By.XPATH, "//canvas[@aria-label='Scan me!']")
        input("Scan the QR code, then press Enter to continue...")
        break
    except:
        try:
            driver.find_element(By.XPATH, "//div[@contenteditable='true']")
            print("Already logged in!")
            break
        except:
            time.sleep(2)

# ✅ Search for Twilio chat
chat_name = "Twilio"
search_box_xpath = "//div[@role='textbox']"
search_box = driver.find_element(By.XPATH, search_box_xpath)
search_box.click()
search_box.send_keys(chat_name)
time.sleep(2)  # Wait for search results
search_box.send_keys(Keys.ENTER)

# ✅ Wait for chat to load
time.sleep(3)
processed_messages = set()  # Store processed messages to avoid duplication

print(f"Monitoring messages in '{chat_name}'... Press Ctrl+C to stop.")

# ✅ Function to send spreadsheet link
def send_email():
    try:
        msg = EmailMessage()
        msg.set_content(f"Here is the spreadsheet link: {SHEET_URL}")
        msg["Subject"] = "Spreadsheet Link"
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)

        print("✅ Spreadsheet link sent to email.")
    except Exception as e:
        print(f"❌ Error sending email: {e}")

# ✅ Function to update product stock
def update_stock(product_name, quantity):
    try:
        data = sheet.get_all_records()  # Get all rows
        found = False

        for i, row in enumerate(data, start=2):  # Start from row 2 (row 1 is headers)
            if row["Product"].lower() == product_name:
                new_quantity = int(row["Stock"]) + quantity  # Add to existing stock
                sheet.update_cell(i, 2, new_quantity)  # Update stock column
                print(f"✅ Updated '{product_name}' stock to {new_quantity}.")
                found = True
                break

        if not found:
            sheet.append_row([product_name, quantity])  # Add new product
            print(f"✅ Added new product '{product_name}' with stock {quantity}.")

    except Exception as e:
        print(f"❌ Error updating stock: {e}")

try:
    while True:
        # ✅ Get the last received message
        try:
            messages = driver.find_elements(By.XPATH, "//div[contains(@class, 'message-in')]")
            if messages:
                last_message = messages[-1]  # Get the last message
                message_text = last_message.text.strip().lower()

                if message_text and message_text not in processed_messages:
                    processed_messages.add(message_text)  # Mark as processed

                    if "check" in message_text:
                        print(f"🚀 CHECK message detected in '{chat_name}', sending spreadsheet link...")
                        send_email()

                    # ✅ Detect "add product quantity" format
                    match = re.match(r"add (\w+) (\d+)", message_text)
                    if match:
                        product = match.group(1)
                        quantity = int(match.group(2))
                        print(f"🛒 Updating stock: {product} +{quantity}")
                        update_stock(product, quantity)

        except Exception as e:
            print(f"Error reading messages: {e}")

        time.sleep(5)  # Refresh every 5 seconds

except KeyboardInterrupt:
    print("\nMonitoring stopped.")
    driver.quit()
