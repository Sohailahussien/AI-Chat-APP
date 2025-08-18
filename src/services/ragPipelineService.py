import json
import os
import sys
from pathlib import Path
import re

# Global storage for documents
documents = []
document_metadata = []

def load_documents():
    """Load documents from JSON storage"""
    global documents, document_metadata
    try:
        if os.path.exists('document_storage.json'):
            with open('document_storage.json', 'r', encoding='utf-8') as f:
                loaded_docs = json.load(f)
                # Ensure it's a list
                documents = loaded_docs if isinstance(loaded_docs, list) else []
        if os.path.exists('document_metadata.json'):
            with open('document_metadata.json', 'r', encoding='utf-8') as f:
                loaded_metadata = json.load(f)
                # Handle both list and dictionary formats
                if isinstance(loaded_metadata, dict):
                    # Convert dictionary to list
                    document_metadata = list(loaded_metadata.values())
                elif isinstance(loaded_metadata, list):
                    document_metadata = loaded_metadata
                else:
                    document_metadata = []
    except Exception as e:
        documents = []
        document_metadata = []

def save_documents():
    """Save documents to JSON storage"""
    try:
        with open('document_storage.json', 'w', encoding='utf-8') as f:
            json.dump(documents, f, ensure_ascii=False, indent=2)
        with open('document_metadata.json', 'w', encoding='utf-8') as f:
            # Ensure document_metadata is a list before saving
            metadata_list = document_metadata if isinstance(document_metadata, list) else []
            json.dump(metadata_list, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving documents: {e}")

def read_text_file(file_path):
    """Read text file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading text file: {e}")
        return ""

def read_docx(file_path):
    """Read DOCX file content"""
    try:
        import docx
        doc = docx.Document(file_path)
        return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        print(f"Error reading DOCX file: {e}")
        return ""

def read_pdf(file_path):
    """Read PDF file content"""
    try:
        import PyPDF2
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return ""

def detect_content_type(file_path):
    """Detect content type based on file extension"""
    ext = Path(file_path).suffix.lower()
    if ext == '.txt':
        return 'text'
    elif ext == '.docx':
        return 'docx'
    elif ext == '.pdf':
        return 'pdf'
    else:
        return 'unknown'

def process_document(file_path):
    """Process document and extract content"""
    content_type = detect_content_type(file_path)
    
    if content_type == 'text':
        content = read_text_file(file_path)
    elif content_type == 'docx':
        content = read_docx(file_path)
    elif content_type == 'pdf':
        content = read_pdf(file_path)
    else:
        content = ""
    
    return content, content_type

def query_documents(query, documents, metadatas):
    """Query documents and return relevant content"""
    if not documents:
        return {"ids": [], "distances": [], "metadatas": [], "documents": []}
    
    # Convert query to lowercase for better matching
    query_lower = query.lower()
    
    # Define keywords for different types of questions
    question_keywords = {
        'what': ['what', 'define', 'explain', 'describe'],
        'how': ['how', 'process', 'method', 'procedure'],
        'why': ['why', 'reason', 'cause', 'purpose'],
        'when': ['when', 'time', 'date', 'period'],
        'where': ['where', 'location', 'place', 'site'],
        'who': ['who', 'person', 'author', 'creator'],
        'topic': ['topic', 'subject', 'theme', 'main idea'],
        'summary': ['summary', 'summarize', 'overview', 'brief'],
        'list': ['list', 'enumerate', 'items', 'points'],
        'compare': ['compare', 'difference', 'similar', 'versus'],
        'example': ['example', 'instance', 'case', 'sample']
    }
    
    # Check if this is a conversational query - make it more specific
    conversational_keywords = [
        'hello', 'hi', 'hey', 'thanks', 'thank you', 'goodbye', 'bye',
        'how are you', 'what\'s up', 'nice to meet you', 'good morning',
        'good afternoon', 'good evening', 'good night'
    ]
    
    # Only treat as conversational if it's a pure greeting
    is_conversational = any(keyword in query_lower for keyword in conversational_keywords) and len(query_lower.split()) <= 3
    
    if is_conversational:
        return {"ids": [], "distances": [], "metadatas": [], "documents": []}
    
    # Check if this is a translation request
    translation_keywords = ['translate', 'translation', 'spanish', 'french', 'german', 'italian', 'portuguese']
    if any(keyword in query_lower for keyword in translation_keywords):
        # Return all documents for translation
        return {
            "ids": [f"doc_{i}" for i in range(len(documents))],
            "distances": [0.0] * len(documents),
            "metadatas": metadatas,
            "documents": documents
        }
    
    # For any other query, return the first document as the most relevant
    return {
        "ids": ["doc_0"],
        "distances": [0.0],
        "metadatas": [metadatas[0]] if metadatas else [],
        "documents": [documents[0]]
    }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print("Usage: python ragPipelineService.py <file_path> or python ragPipelineService.py --query <query>")
        return
    
    load_documents()
    
    if sys.argv[1] == '--query' and len(sys.argv) >= 3:
        # Handle query
        query = ' '.join(sys.argv[2:])
        result = query_documents(query, documents, document_metadata)
        print(json.dumps(result, ensure_ascii=True))
    elif len(sys.argv) >= 2:
        # Handle file upload
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            content, content_type = process_document(file_path)
            if content:
                documents.append(content)
                document_metadata.append({
                    "source": file_path,
                    "content_type": content_type,
                    "uploaded_at": "2025-01-01T00:00:00.000000",
                    "word_count": len(content.split())
                })
                save_documents()
                print(f"Successfully processed: {file_path}")
            else:
                print(f"Failed to extract content from: {file_path}")
        else:
            print(f"File not found: {file_path}")

if __name__ == "__main__":
    main() 