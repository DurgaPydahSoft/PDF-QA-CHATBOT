import requests
import os
from dotenv import load_dotenv

load_dotenv()

raw_key = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_KEY = raw_key.strip().strip('"').strip("'") if raw_key else None

def get_llm_response(prompt: str, model: str = "mistralai/devstral-2512:free") -> str:
    """Sends a prompt to OpenRouter and returns the LLM response."""
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY not found in environment."

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error calling OpenRouter: {e}")
        return f"Error: {e}"

if __name__ == "__main__":
    # Test
    print(get_llm_response("Hello, who are you?"))
