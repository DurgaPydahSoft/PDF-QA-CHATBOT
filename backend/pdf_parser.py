import pypdf
from typing import List

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts text from a given PDF file path."""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = pypdf.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""
    return text.strip()

if __name__ == "__main__":
    # Test script if run directly
    import sys
    if len(sys.argv) > 1:
        extracted = extract_text_from_pdf(sys.argv[1])
        print(f"Extracted {len(extracted)} characters.")
    else:
        print("Please provide a PDF path to test.")
