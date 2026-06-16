import zipfile
import xml.etree.ElementTree as ET
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
docx_path = os.path.join(script_dir, "..", "CSE492_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")
output_path = os.path.join(script_dir, "cse492_text.txt")

if not os.path.exists(docx_path):
    print("File not found")
    exit()

namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def extract_docx_text(docx_file):
    with zipfile.ZipFile(docx_file) as z:
        xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        paragraphs_text = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            # Find style
            pPr = paragraph.find('w:pPr', namespace)
            style_name = ""
            if pPr is not None:
                pStyle = pPr.find('w:pStyle', namespace)
                if pStyle is not None:
                    style_name = pStyle.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
            
            # Find text
            texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            p_text = "".join(texts)
            
            if style_name:
                paragraphs_text.append(f"[{style_name}] {p_text}")
            else:
                paragraphs_text.append(p_text)
                
        return "\n".join(paragraphs_text)

try:
    full_text = extract_docx_text(docx_path)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_text)
    print(f"Successfully extracted document text to cse492_text.txt. Total length: {len(full_text)} chars")
except Exception as e:
    print(f"Error: {e}")
