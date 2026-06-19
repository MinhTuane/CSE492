"""
Extract full text from CSE492 and CSE493 to compare - with UTF-8 encoding fix.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from docx import Document
import os

BASE = r"c:\Users\cmyli\OneDrive - eiu.edu.vn\Desktop\CSE492-main"

def extract_text_with_styles(filepath, max_lines=None):
    doc = Document(filepath)
    result = []
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if not text:
            continue
        style = para.style.name if para.style else "Normal"
        # Shorten style names
        short_style = style[0] if style else "?"
        if 'Heading' in style:
            short_style = style.replace('Heading ', 'h')
        elif style == 'Normal':
            short_style = 'n'
        elif 'Caption' in style:
            short_style = 'Caption'
        result.append((i, short_style, text))
        if max_lines and len(result) >= max_lines:
            break
    return result

# Extract from CSE493
file_493 = os.path.join(BASE, "CSE493_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")

print("=" * 80)
print("CSE493 FULL STRUCTURE:")
print("=" * 80)
texts_493 = extract_text_with_styles(file_493, max_lines=800)
for idx, style, text in texts_493:
    print(f"[{idx}][{style}] {text[:180]}")

print(f"\n\nTotal paragraphs: {len(texts_493)}")
