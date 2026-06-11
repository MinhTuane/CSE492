import os
import requests

hero_dir = "src/main/resources/static/images/hero"
os.makedirs(hero_dir, exist_ok=True)

urls = {
    "slide-1.png": "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "slide-2.png": "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "slide-3.png": "https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "slide-4.png": "https://images.pexels.com/photos/2626661/pexels-photo-2626661.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "parallax-showroom.png": "https://images.pexels.com/photos/2626660/pexels-photo-2626660.jpeg?auto=compress&cs=tinysrgb&w=1920"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print("Starting high-resolution hero slides download...")
for name, url in urls.items():
    path = os.path.join(hero_dir, name)
    print(f"Downloading {name}...")
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 200:
            with open(path, "wb") as f:
                f.write(r.content)
            print(f"[+] Saved: {name} ({len(r.content)} bytes)")
        else:
            print(f"[-] Failed {name}: HTTP {r.status_code}")
    except Exception as e:
        print(f"[!] Error downloading {name}: {e}")

print("Hero images download task completed.")
