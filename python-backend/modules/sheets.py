import gspread
import pandas as pd
from oauth2client.service_account import ServiceAccountCredentials
import sys
import re

def read_google_sheet(sheet_url):
    """
    Reads data from a Google Sheet URL and returns it as a pandas DataFrame.
    
    Args:
        sheet_url (str): The URL of the Google Sheet to read
        
    Returns:
        pandas.DataFrame: DataFrame containing the sheet data
    """
    try:
        # Define the scope
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        
        # Add credentials to the account
        creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
        
        # Authorize the client
        client = gspread.authorize(creds)
        
        # Extract the sheet ID from the URL
        sheet_id_match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
        if not sheet_id_match:
            print("Invalid Google Sheet URL")
            return None
            
        sheet_id = sheet_id_match.group(1)
        
        # Open the spreadsheet by its ID
        sheet = client.open_by_key(sheet_id)
        
        # Get the first worksheet (index 0)
        sheet_instance = sheet.get_worksheet(0)
        
        # Get all records of the data
        records_data = sheet_instance.get_all_records()
        
        # Convert to dataframe
        records_df = pd.DataFrame.from_dict(records_data)

        records_json = records_df.to_json(orient='records')
        print(records_json)
        
        return records_json
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    if len(sys.argv) > 1:
        sheet_url = sys.argv[1]
    else:
        sheet_url = input("Enter the Google Sheet URL: ")
    
    print("Reading data from Google Sheet...")
    df = read_google_sheet(sheet_url)

if __name__ == "__main__":
    main()