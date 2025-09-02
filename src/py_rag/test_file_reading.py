#!/usr/bin/env python3

import pathlib
import sys
import os

# Add the parent directory to the path so we can import the functions
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from simple_rag_service import _read_text_file, _read_docx_file, _read_pdf_file

def test_file_reading():
    """Test file reading functions"""
    
    # Test text file
    txt_file = "../../uploads/test_user1.txt"
    print(f"Testing text file: {txt_file}")
    print(f"File exists: {os.path.exists(txt_file)}")
    if os.path.exists(txt_file):
        try:
            content = _read_text_file(txt_file)
            print(f"Text content length: {len(content)}")
            print(f"Text content preview: {content[:100]}...")
        except Exception as e:
            print(f"Error reading text file: {e}")
    
    # Test DOCX file
    docx_file = "../../uploads/1755644108605-THE TOWN DOWN.docx"
    print(f"\nTesting DOCX file: {docx_file}")
    print(f"File exists: {os.path.exists(docx_file)}")
    if os.path.exists(docx_file):
        try:
            content = _read_text_file(docx_file)
            print(f"DOCX content length: {len(content)}")
            print(f"DOCX content preview: {content[:100]}...")
        except Exception as e:
            print(f"Error reading DOCX file: {e}")
    
    # Test direct file reading
    print(f"\nTesting direct file reading:")
    try:
        with open(txt_file, 'r', encoding='utf-8') as f:
            direct_content = f.read()
            print(f"Direct read content length: {len(direct_content)}")
            print(f"Direct read content: {direct_content}")
    except Exception as e:
        print(f"Error with direct file reading: {e}")

if __name__ == "__main__":
    test_file_reading()
