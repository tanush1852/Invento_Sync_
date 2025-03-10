import json
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from twilio.rest import Client

# Telegram Bot Credentials
BOT_TOKEN = "7816940525:AAHrHSV8dLJU0fthO1KPq1ippAeJpczD5hY"
CHAT_ID = "1219722877"

# Twilio configuration
TWILIO_ACCOUNT_SID = 'AC590835ca165e023069e60eeb43318808'
TWILIO_AUTH_TOKEN = '33bbfe42aaf54fcecccd447adc97ea97'
TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"
WHATSAPP_TO = "whatsapp:+918657264290"

# Email credentials
SENDER_EMAIL = "tanush1852@gmail.com"
SENDER_PASSWORD = "jznc oexc xzlc fbck"

# Function to send Telegram message
def send_telegram_message(text):
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": text}
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"Telegram Message Sent: {text}")
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

# Function to send email
def send_email(subject, body, sender_email, receiver_email):
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, SENDER_PASSWORD)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        print(f"Email Sent: {subject}")
    except Exception as e:
        print(f"Failed to send email: {e}")

# Function to send WhatsApp message
def send_whatsapp(message):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=TWILIO_WHATSAPP_FROM, to=WHATSAPP_TO)
        print(f"WhatsApp Message Sent: {message}")
    except Exception as e:
        print(f"Failed to send WhatsApp message: {e}")

# Function to send alerts
def send_alerts(content):
    festival_name = content["festival"]
    goods_list = ", ".join(content["goods"])
    
    message = f"🎉 Reminder: {festival_name} is coming up!\nPrepare these items: {goods_list}"
    subject = f"Reminder: {festival_name}"

    print(f"Sending Alerts for: {festival_name}")
    
    send_email(subject, message, SENDER_EMAIL, SENDER_EMAIL)
    send_whatsapp(message)
    send_telegram_message(message)

# Function to check reminder dates
def check_reminder_dates():
    try:
        with open('reminders.json', 'r') as f:
            reminders = json.load(f)

        today = datetime.datetime.today().date()
        fifteen_days_ago = today - datetime.timedelta(days=15)

        print(f"Today's Date: {today}")
        print(f"Checking for reminders on {today} or {fifteen_days_ago}")

        for reminder in reminders:
            reminder_date = datetime.datetime.strptime(reminder['date'], '%Y-%m-%d').date()
            print(f"Checking Reminder: {reminder_date} - {reminder['content']['festival']}")

            if today <= reminder_date <= today + datetime.timedelta(days=15):

                print(f"Sending Alerts for: {reminder['content']['festival']}")
                send_alerts(reminder['content'])

    except Exception as e:
        print(f"Error reading JSON file: {e}")

if __name__ == "__main__":
    check_reminder_dates()
