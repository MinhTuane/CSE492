import os
import re

dir_path = r"c:\Users\cmyli\OneDrive - eiu.edu.vn\Desktop\CSE492-main\src\main\java\com\capstone\mbservices\controller"

replacements = {
    # 6-role / 5-role staff list -> ADMIN, STAFF_SERVICE, STAFF_CS
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER',\s*'SALES_STAFF',\s*'SERVICE_ADVISOR'\)": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS')",
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER',\s*'STAFF',\s*'SALES_STAFF',\s*'SERVICE_ADVISOR'\)": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS')",
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER',\s*'STAFF',\s*'SALES_STAFF',\s*'SERVICE_ADVISOR'\) or": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS') or",
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER',\s*'STAFF',\s*'SALES_STAFF',\s*'SERVICE_ADVISOR'\)\s+or": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS') or",
    
    # 4-role / 3-role lists
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER',\s*'SERVICE_ADVISOR'\)": "hasAnyRole('ADMIN', 'STAFF_SERVICE')",
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN',\s*'BRANCH_MANAGER'\)": "hasRole('ADMIN')",
    r"hasAnyRole\('ADMIN',\s*'SUPER_ADMIN'\)": "hasRole('ADMIN')",
    r"hasRole\('SUPER_ADMIN'\)": "hasRole('ADMIN')",
    r"hasAnyRole\('ADMIN',\s*'STAFF'\)": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS')",
    r"hasAnyRole\('ADMIN',\s*'STAFF',\s*'CUSTOMER'\)": "hasAnyRole('ADMIN', 'STAFF_SERVICE', 'STAFF_CS', 'CUSTOMER')",
    
    # Let's ensure STAFF_CSKH is renamed to STAFF_CS
    r"STAFF_CSKH": "STAFF_CS"
}

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith(".java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            modified = False
            for pattern, repl in replacements.items():
                new_content, count = re.subn(pattern, repl, content)
                if count > 0:
                    content = new_content
                    modified = True
                    print(f"Replaced {pattern} -> {repl} in {file} ({count} times)")
            
            if modified:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Saved changes to {file}")
