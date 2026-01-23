import requests
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

raw_key = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_KEY = raw_key.strip().strip('"').strip("'") if raw_key else None

def get_llm_response(
    prompt: str, 
    model: str = "mistralai/devstral-2512:free",
    conversation_history: Optional[List[Dict[str, str]]] = None,
    rag_context: Optional[str] = None
) -> str:
    """Sends a prompt to OpenRouter and returns the LLM response.
    
    Args:
        prompt: The current prompt/question
        model: The model to use
        conversation_history: Optional list of previous messages in format [{"role": "user/assistant", "content": "..."}]
        rag_context: Optional RAG context from document search
    """
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY not found in environment."

    try:
        # Build messages array
        messages = []
        
        # Build system message with RAG context if provided
        system_content = "You are a friendly, enthusiastic, and highly intelligent AI assistant. Your goal is to provide impressive, enjoyable, and helpful insights from documents.\n\n"
        system_content += "Guidelines:\n"
        system_content += "- **Tone**: Be warm, engaging, and slightly conversational. Use occasional emojis (like ✨, 🚀, 📚, 💡) to make the response lively!\n"
        system_content += "- **Be Concise but Impressive**: Explain things clearly but with flair.\n"
        system_content += "- **Cite Sources**: Always cite the source file for your information using the format **[Source: filename]**.\n"
        system_content += "- **Structure**: Use clear headers and bullet points for readability.\n"
        system_content += "- **No Hallucinations**: Answer ONLY based on the provided document context.\n"
        system_content += "- **Formatting**: Use Markdown for headers (#), bold (**), and lists.\n"
        system_content += "- **Conversation Continuity**: When previous messages are provided, maintain context and explicitly reference them when answering follow-up questions.\n\n"
        
        if rag_context:
            system_content += f"Document Context:\n{rag_context}\n\n"
        
        system_message = {
            "role": "system",
            "content": system_content
        }
        messages.append(system_message)
        
        # Add conversation history if provided
        if conversation_history:
            # Ensure history is in correct format
            for msg in conversation_history:
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    # Map frontend roles to API roles
                    role = msg["role"]
                    if role == "bot":
                        role = "assistant"
                    messages.append({
                        "role": role,
                        "content": msg["content"]
                    })
        
        # Add current prompt (question)
        messages.append({"role": "user", "content": prompt})
        
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages
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
