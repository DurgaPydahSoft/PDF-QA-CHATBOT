import pypdf
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation
import io

def extract_text_from_pdf(file_stream) -> str:
    text = ""
    try:
        import fitz  # PyMuPDF
        # fitz requires a file path or bytes, not a BytesIO object directly for `open`.
        # But we can pass the stream content as bytes to `open(stream=..., filetype="pdf")`
        doc = fitz.open(stream=file_stream.read(), filetype="pdf")
        print(f"DEBUG: PDF has {len(doc)} pages.")
        for i, page in enumerate(doc):
            page_text = page.get_text()
            text += page_text + "\n"
            if i % 10 == 0:
                print(f"DEBUG: Parsed page {i+1}, text len so far: {len(text)}")
        
        print(f"DEBUG: Final extracted text length: {len(text)}")
        
    except Exception as e:
        print(f"Error extracting text from PDF with PyMuPDF: {e}")
        # Fallback (optional, but good for safety)
        try:
            file_stream.seek(0)
            reader = pypdf.PdfReader(file_stream)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e2:
             print(f"Fallback PDF extraction failed: {e2}")

    return text.strip()

def extract_text_from_docx(file_stream) -> str:
    text = ""
    try:
        doc = Document(file_stream)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
    return text.strip()

def extract_text_from_xlsx(file_stream) -> str:
    text = ""
    try:
        wb = load_workbook(file_stream, data_only=True)
        for sheet in wb.sheetnames:
            ws = wb[sheet]
            for row in ws.iter_rows(values_only=True):
                row_text = " ".join([str(cell) for cell in row if cell is not None])
                if row_text:
                    text += row_text + "\n"
    except Exception as e:
        print(f"Error extracting text from XLSX: {e}")
    return text.strip()

def extract_text_from_pptx(file_stream) -> str:
    text = ""
    try:
        prs = Presentation(file_stream)
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
    except Exception as e:
        print(f"Error extracting text from PPTX: {e}")
    return text.strip()

def extract_text(file_content: bytes, filename: str) -> str:
    import os
    _, ext = os.path.splitext(filename.lower())
    ext = ext.lstrip('.')
    file_stream = io.BytesIO(file_content)
    
    if ext == 'pdf':
        return extract_text_from_pdf(file_stream)
    elif ext == 'docx':
        return extract_text_from_docx(file_stream)
    elif ext in ['xlsx', 'xls']:
        return extract_text_from_xlsx(file_stream)
    elif ext == 'pptx':
        return extract_text_from_pptx(file_stream)
    elif ext == 'txt':
        try:
            return file_content.decode('utf-8')
        except:
            return file_content.decode('latin-1')
    else:
        print(f"Unsupported file extension for '{filename}': {ext}")
        return ""
