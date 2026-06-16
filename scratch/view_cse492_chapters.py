import os

script_dir = os.path.dirname(os.path.abspath(__file__))
txt_path = os.path.join(script_dir, "cse492_text.txt")
output_path = os.path.join(script_dir, "cse492_ch1_3.txt")

if not os.path.exists(txt_path):
    print("File not found")
    exit()

with open(txt_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

ch1_3_lines = []
capturing = False

for line in lines:
    if "[h1] Chapter 1. Introduction" in line:
        capturing = True
    elif "[h1] Chapter 4. Results And Discussion" in line or "[h1] Chapter 4. Results and Discussion" in line:
        capturing = False
    
    if capturing:
        ch1_3_lines.append(line)

with open(output_path, "w", encoding="utf-8") as f:
    f.writelines(ch1_3_lines)

print(f"Extracted {len(ch1_3_lines)} lines of Chapters 1-3 to cse492_ch1_3.txt")
