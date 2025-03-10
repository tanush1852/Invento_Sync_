import openai
import google.generativeai as gemini
class LLMModelInterface:
    def __init__(self):
        pass

    @staticmethod
    def call_openai_gpt4_mini(prompt: str, api_key: str) -> str:
        client = openai.OpenAI(api_key = api_key)
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                {"role": "developer", "content": "You are an instruction following AI model that behaves and strictly follows the instructions given to you in the prompt."},
                {"role": "user", "content": prompt}
            ],
                max_tokens=8000,
                temperature=0.01
            )
            # print(response.choices[0].message.content.strip())
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(e)
            return f"Error calling OpenAI GPT-4o Mini: {e}"
        
    @staticmethod
    def call_gemini(prompt: str, api_key: str, disable_parse = None) -> str:
        """Call Google's Gemini model via Generative AI API."""
        gemini.configure(api_key=api_key)
        try:
            model = gemini.GenerativeModel("gemini-2.0-flash")
            # print(prompt)
            response = model.generate_content(prompt)
            text = response.text
            # print(text)
            if disable_parse == True:
                return text.strip()
            if "{" in text and "}" in text:
                start = text.find("{")
                end = text.rfind("}") + 1
                result = text[start:end]
                return result.strip()
            else:
                raise ValueError("Model did not return a valid dictionary.")
        except Exception as e:
            print(e)
            return f"Error calling the Gemini model: {e}"
