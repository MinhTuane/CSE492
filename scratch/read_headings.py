import zipfile
import re
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
docx_path = os.path.join(script_dir, "..", "CSE492_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")
output_path = os.path.join(script_dir, "headings_list.txt")

if not os.path.exists(docx_path):
    print("File not found")
    exit()

try:
    with zipfile.ZipFile(docx_path) as z:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        
        # Heading tags in Word XML usually have <w:pStyle w:val="Heading..."/> or similar style tags
        # Let's extract all paragraphs and check if they are headings
        paragraphs = re.findall(r'<w:p\b[^>]*>(.*?)</w:p>', doc_xml)
        
        heading_pattern = re.compile(r'<w:pStyle w:val="([^"]+)"/>')
        text_pattern = re.compile(r'<w:t\b[^>]*>(.*?)</w:t>')
        
        headings = []
        for p in paragraphs:
            style_match = heading_pattern.search(p)
            if style_match:
                style = style_match.group(1)
                text_parts = text_pattern.findall(p)
                p_text = "".join(text_parts)
                headings.append((style, p_text))
                
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"Found {len(headings)} headings:\n")
            for idx, (style, text) in enumerate(headings):
                f.write(f"{idx+1}. [{style}] {text}\n")
        print(f"Successfully wrote {len(headings)} headings to headings_list.txt")
            
except Exception as e:
    print(f"Error: {e}")
