import zipfile
import re
import os

# Paths to the docx files relative to this script (inside scratch directory)
script_dir = os.path.dirname(os.path.abspath(__file__))
docx_files = [
    os.path.join(script_dir, "..", "CSE491_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx"),
    os.path.join(script_dir, "..", "CSE492_MotoMarket_Motorcycle Marketplace and Service Hub_Pham Minh Tuan_Dang Pham Huu Thao.docx")
]

vietnamese_re = re.compile(r'[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸÝĐ]')

for abs_path in docx_files:
    if not os.path.exists(abs_path):
        print(f"File not found: {abs_path}")
        continue
    try:
        with zipfile.ZipFile(abs_path) as z:
            doc_xml = z.read("word/document.xml").decode("utf-8")
            # Strip XML tags to get raw text
            text = re.sub(r'<[^>]+>', ' ', doc_xml)
            # Find all Vietnamese words
            vietnamese_words = []
            for word in text.split():
                if vietnamese_re.search(word):
                    vietnamese_words.append(word)
            
            print(f"\n--- Results for {os.path.basename(abs_path)} ---")
            print(f"Total words: {len(text.split())}")
            print(f"Vietnamese words found count: {len(vietnamese_words)}")
            if vietnamese_words:
                print("First 20 Vietnamese words:")
                print(vietnamese_words[:20])
            else:
                print("Perfect! No Vietnamese words found.")
    except Exception as e:
        print(f"Error checking {os.path.basename(abs_path)}: {e}")
