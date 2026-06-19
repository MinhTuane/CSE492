"""
Extract full TOC-level structure comparison between CSE492 and CSE493.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from docx import Document
import os

BASE = r"c:\Users\cmyli\OneDrive - eiu.edu.vn\Desktop\CSE492-main"

def extract_section_structure(filepath):
    """Extract all section headers (numbered sections) from document."""
    doc = Document(filepath)
    headers = []
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if not text:
            continue
        style = para.style.name if para.style else "Normal"
        if 'toc' in style.lower():
            continue
        # Detect heading-like patterns
        if any(s in style for s in ['Heading', 'heading', 'h1', 'h2', 'h3']):
            if any(text.startswith(x) for x in ['Chapter', '1.', '2.', '3.', '4.', '5.', 'References']):
                headers.append(f"  [{style}] {text[:120]}")
    return headers

file_492 = os.path.join(BASE, "CSE492_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")
file_493 = os.path.join(BASE, "CSE493_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")

print("=" * 80)
print("CSE492 SECTION STRUCTURE:")
print("=" * 80)
for h in extract_section_structure(file_492):
    print(h)

print("\n" + "=" * 80)
print("CSE493 SECTION STRUCTURE:")
print("=" * 80)
for h in extract_section_structure(file_493):
    print(h)
