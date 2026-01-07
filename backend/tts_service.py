import io
import base64
import re
from gtts import gTTS

def clean_text_for_speech(text: str) -> str:
    """
    Cleans text for better speech synthesis:
    1. Removes markdown symbols (*, #, `).
    2. Removes emojis.
    3. Collapses extra whitespace.
    """
    # Remove markdown bold/italic markers (* or _)
    text = re.sub(r'[\*_`]', '', text)
    
    # Remove headers (#)
    text = re.sub(r'#+\s', '', text)
    
    # Remove links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

    # Remove Emojis (unicode range)
    # This regex covers a wide range of common emojis
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    
    # Remove specific "Suggestions:" text if we don't want it read
    # We split by "Suggestions:" (case-insensitive) and take the first part
    if "Suggestions:" in text:
        text = text.split("Suggestions:")[0]
    elif "suggestions:" in text:
        text = text.split("suggestions:")[0]
    
    return text.strip()

def text_to_speech_base64(text: str, lang: str = 'en') -> str:
    """
    Converts text to speech using Google Text-to-Speech (gTTS)
    and returns the audio data as a base64 encoded string.
    """
    try:
        # Pre-process text to remove artifacts
        clean_text = clean_text_for_speech(text)
        
        if not clean_text:
            return None

        tts = gTTS(text=clean_text, lang=lang, slow=False)
        
        # Save to in-memory file
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # Encode to base64
        audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        return audio_base64
    except Exception as e:
        print(f"TTS generation failed: {e}")
        return None
