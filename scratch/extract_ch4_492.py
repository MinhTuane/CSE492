"""
Extract Chapter 4 content from CSE492 for comparison.
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from docx import Document
import os

BASE = r"c:\Users\cmyli\OneDrive - eiu.edu.vn\Desktop\CSE492-main"

file_492 = os.path.join(BASE, "CSE492_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")

doc = Document(file_492)
in_chapter4 = False
chapter4_content = []

for i, para in enumerate(doc.paragraphs):
    text = para.text.strip()
    if not text:
        continue
    style = para.style.name if para.style else "Normal"
    
    if 'toc' in style.lower():
        continue

    if ('Chapter 4' in text) and 'toc' not in style.lower():
        in_chapter4 = True
    
    if in_chapter4 and ('Chapter 5' in text) and 'toc' not in style.lower():
        break
    
    if in_chapter4:
        chapter4_content.append((i, style, text))

print("=" * 80)
print(f"CSE492 - CHAPTER 4 CONTENT ({len(chapter4_content)} paragraphs)")
print("=" * 80)
for idx, style, text in chapter4_content:
    print(f"\n[{idx}][{style}] {text}")
