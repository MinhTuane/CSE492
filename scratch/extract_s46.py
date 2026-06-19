"""
Extract section 4.6 (UI Implementation) from CSE493.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from docx import Document
import os

BASE = r"c:\Users\cmyli\OneDrive - eiu.edu.vn\Desktop\CSE492-main"
file_493 = os.path.join(BASE, "CSE493_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")

doc = Document(file_493)
in_section = False
content = []

for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    if not text:
        continue
    style = para.style.name if para.style else "Normal"
    if 'toc' in style.lower():
        continue

    if text.startswith('4.6'):
        in_section = True
    
    if in_section and text.startswith('4.7'):
        break
    
    if in_section:
        content.append((i, style, text))

print("=" * 80)
print(f"CSE493 - Section 4.6 UI Implementation ({len(content)} paragraphs)")
print("=" * 80)
for idx, style, text in content:
    print(f"\n[{idx}][{style}] {text[:250]}")
