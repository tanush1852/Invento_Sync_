from google.oauth2.service_account import Credentials
import gspread
import datetime
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import requests
from dotenv import load_dotenv
import os
load_dotenv()

# Twilio configuration
TWILIO_ACCOUNT_SID =os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')  
TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"
WHATSAPP_TO = os.getenv('WHATSAPP_TO')

# Telegram Bot Credentials
BOT_TOKEN =os.getenv('BOT_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')

# Store processed alerts
processed_alerts = set()

def authenticate_gsheet():
    creds = Credentials.from_service_account_file("twitter-clone-440006-ed01aaa3bd45.json", scopes=["https://www.googleapis.com/auth/spreadsheets"])
    client = gspread.authorize(creds)
    return client

def get_sheet(client, sheet_url):
    return client.open_by_url(sheet_url).sheet1

def send_telegram_message(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": text}
    requests.post(url, json=payload)

def send_email(subject, body, sender_email, receiver_email):
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, os.getenv('SENDER_PASSWORD'))
            server.sendmail(sender_email, receiver_email, msg.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")

def send_whatsapp(message):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_WHATSAPP_FROM, to=WHATSAPP_TO)
    except Exception as e:
        print(f"Failed to send WhatsApp message: {e}")

def send_alerts(subject, body, alert_type):
    alert_key = f"{alert_type}:{body}"
    if alert_key not in processed_alerts:
        processed_alerts.add(alert_key)
        send_email(subject, body, "tanush1852@gmail.com", "tanush.salian22@spit.ac.in")
        send_whatsapp(f"{alert_type} Alert:\n\n{body}")
        send_telegram_message(f"🚨 {alert_type} Alert:\n\n{body}")

def check_expired_products(sheet):
    records = sheet.get_all_records()
    today = datetime.datetime.today()
    expired_products = []
    for i, row in enumerate(records, start=2):
        product_name = row['Products']
        stock = row['Stock'] - row['Sales Quantity']
        expiry_days = row['Expiry Days']
        cost_price = row['Cost Price']
        try:
            product_date = datetime.datetime.strptime(row['Date'], '%m-%d-%Y')
            expiry_date = product_date + datetime.timedelta(days=expiry_days)
            if today >= expiry_date and stock > 0:
                loss = cost_price * stock
                expired_products.append((product_name, stock, loss))
                sheet.update_cell(i, 4, 0)
        except ValueError:
            continue
    if expired_products:
        alert_body = "Expired products:\n\n" + "\n".join([f"{p[0]}, Stock: {p[1]}, Loss: ₹{p[2]:.2f}" for p in expired_products])
        send_alerts("Product Expired Alert", alert_body, "Expired Products")

def check_stock_levels(sheet):
    records = sheet.get_all_records()
    understock_products, overstock_products = [], []
    for row in records:
        product_name = row['Products']
        current_stock = row['Stock'] 
        lower_threshold = row.get('Low Threshold', 5)
        higher_threshold = row.get('High Threshold', 100)
        
        # Understock: Alert only if stock is below the lower threshold
        if current_stock < lower_threshold:
            understock_deficit = lower_threshold - current_stock
            understock_products.append((product_name, current_stock, lower_threshold, understock_deficit))

        # Overstock: Alert only if stock is above the higher threshold
        elif current_stock > higher_threshold:
            overstock_surplus = current_stock - higher_threshold
            overstock_products.append((product_name, current_stock, higher_threshold, overstock_surplus))
    
    # Handling understock alert (only if below lower threshold)
    if understock_products:
        alert_body = "The following products are understocked and need restocking:\n\n"
        alert_body += "\n".join([
            f"Product: {p[0]}, Current Stock: {p[1]}, Lower Threshold: {p[2]}, Deficit: {p[3]} units. Please restock to avoid running out."
            for p in understock_products
        ])
        send_alerts("Understock Alert", alert_body, "Understock")

    # Handling overstock alert (only if above higher threshold)
    if overstock_products:
        alert_body = "The following products are overstocked and occupying excess storage:\n\n"
        alert_body += "\n".join([
            f"Product: {p[0]}, Current Stock: {p[1]}, Higher Threshold: {p[2]}, Surplus: {p[3]} units. Consider reducing stock to avoid excess storage costs."
            for p in overstock_products
        ])
        send_alerts("Overstock Alert", alert_body, "Overstock")

def monitor_spreadsheet(sheet, interval=60):
    while True:
        check_expired_products(sheet)
        check_stock_levels(sheet)
        time.sleep(interval)

if __name__ == "__main__":
    SHEET_URL =os.getenv('SHEET_URL')
    client = authenticate_gsheet()
    sheet = get_sheet(client, SHEET_URL)
    monitor_spreadsheet(sheet, interval=10)
