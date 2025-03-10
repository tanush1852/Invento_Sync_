import os 
import pandas as pd 
import matplotlib.pyplot as plt 
import seaborn as sns 
from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents.agent_types import AgentType
from datetime import datetime, timedelta
import json
import re
from dotenv import load_dotenv


load_dotenv()       
# Set your Google API key
google_api_key = "AIzaSyBPehLg83WKXg-klMHqv6HsaYow53CHZ6Q"

# Initialize the Gemini model
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.1,
    convert_system_message_to_human=True,
    google_api_key=google_api_key  # Use the loaded API key
    
)



# Create a pandas dataframe agent with Gemini
def create_gemini_dataframe_agent(df):
    return create_pandas_dataframe_agent(
        llm=gemini_llm,
        df=df,
        verbose=True,
        agent_type=AgentType.OPENAI_FUNCTIONS,
        allow_dangerous_code=True  # Add this line to address the security warning
    )

def generate_indian_festivals_2025():
    """Generate a list of major Indian festivals for 2025 using Gemini 2.0 Flash"""
    try:
        # Create a query asking for festival information
        query = """
        Generate a comprehensive list of major Indian festivals for the year 2025 with their exact dates.
        
        Include:
        1. Festival name
        2. Date in YYYY-MM-DD format
        Include at least 20 major festivals covering different regions and religions of India
        (Hindu, Muslim, Sikh, Christian, Jain, Buddhist festivals).
        
        Format the response as a JSON object with date as key and festival name as value.
        Example: {"2025-01-14": "Makar Sankranti", "2025-03-14": "Holi", "2025-10-22": "Diwali"}
        
        Return only the JSON object without any additional text.
        """
        
        # Get response from the model
        response = gemini_llm.invoke(query)
        
        # Print the raw response
        print("\nRaw response from Gemini 2.0 Flash:")
        print(response.content)
        
        # Extract JSON from the response
        import re
        import json
        
        # Look for JSON pattern in the response
        json_pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'
        match = re.search(json_pattern, response.content, re.DOTALL)
        
        if match:
            # Extract the JSON object
            json_str = match.group(0)
            
            try:
                # Parse the JSON
                festivals_dict = json.loads(json_str)
                
                # Save to JSON file
                import os
                output_path = os.path.join(os.path.dirname(__file__), "indian_festivals_2025.json")
                
                with open(output_path, 'w') as json_file:
                    json.dump(festivals_dict, json_file, indent=2)
                
                print(f"\nSaved festivals data to: {output_path}")
                
                return festivals_dict
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
                print("Please check the raw response and try again.")
                return {"error": "Failed to parse JSON from LLM response"}
        else:
            print("Could not find JSON in the response.")
            return {"error": "No JSON found in LLM response"}
            
    except Exception as e:
        print(f"Error generating festivals list: {str(e)}")
        return {"error": str(e)}

def extract_festival_names(festivals_dict):
    """Extract only the festival names from the festivals dictionary"""
    try:
        # Check if it's an error dictionary
        if 'error' in festivals_dict:
            print(f"Error in festivals data: {festivals_dict['error']}")
            return []
        
        # Get all festival names (values from the dictionary)
        festival_names = list(festivals_dict.values())
        
        print(f"Extracted {len(festival_names)} festival names")
        return festival_names
    except Exception as e:
        print(f"Error extracting festival names: {str(e)}")
        return []

def generate_most_goods_sold_in_festivals(festival_data):
    """Generate a list of goods that are most sold during festivals"""
    try:
        # Create a query asking for goods sold during festivals
        festivals_str = ", ".join(festival_data["festivals"][:len(festival_data)+1])  # Limit to first 5 festivals to avoid token limits
        
        query = f"""
        Generate a list of goods that are most sold during Indian festivals, from the perspective of a general store, sweet store or an electronics store.
        
        For each of these festivals, list 3-4 types of goods that are commonly purchased:
        {festivals_str}
        Do this for atleast 15 major Indian festivals.
        Format the response as a JSON object with festival names as keys and arrays of goods as values.
        Example: {{"Diwali": ["Sweets", "Electronics", "Clothing"], 
                  "Holi": ["Colors", "Water guns", "Sweets", "Traditional clothing"]}}
        
        Return only the JSON object without any additional text.
        """
        
        # Get response from the model
        response = gemini_llm.invoke(query)
        
        # Print the raw response
        print("\nRaw response from Gemini 2.0 Flash:")
        print(response.content)
        
        # Extract JSON from the response
        json_pattern = r'\{(?:[^{}]|(?:\{[^{}]*\}))*\}'
        match = re.search(json_pattern, response.content, re.DOTALL)
        
        if match:
            # Extract the JSON object
            json_str = match.group(0)
            
            try:
                # Parse the JSON
                goods_dict = json.loads(json_str)
                
                # Save to JSON file
                output_path = os.path.join(os.path.dirname(__file__), "festival_goods.json")
                
                with open(output_path, 'w') as json_file:
                    json.dump(goods_dict, json_file, indent=2)
                
                print(f"\nSaved festival goods data to: {output_path}")
                
                return goods_dict
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON: {e}")
                print("Please check the raw response and try again.")
                return {"error": f"Failed to parse JSON from LLM response: {e}"}
        else:
            print("Could not find JSON in the response.")
            return {"error": "No JSON found in LLM response"}
            
    except Exception as e:
        print(f"Error generating goods list: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    print("Generating list of major Indian festivals for 2025 using Gemini 2.0 Flash...")
    
    # Call the function to generate festivals
    festivals_dict = generate_indian_festivals_2025()
    
    # Print the result as JSON
    print("\nIndian Festivals 2025:")
    print(json.dumps(festivals_dict, indent=2))
    
    # Extract just the festival names
    festival_names = extract_festival_names(festivals_dict)
    
    print("\nExtracted festival names:")
    for i, name in enumerate(festival_names, 1):
        print(f"{i}. {name}")
    
    # Create a dictionary with just the festival names to pass to other agents
    festival_data = {"festivals": festival_names}
    
    goods_dict = generate_most_goods_sold_in_festivals(festival_data)
    print("\nMost Goods Sold on festivals:")
    print(json.dumps(goods_dict, indent=2))


