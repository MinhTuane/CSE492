import os
import re
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "src", "main", "resources", "static", "images", "accessories")
JSON_PATH = os.path.join(BASE_DIR, "src", "main", "resources", "accessories.json")

# Ensure target directories exist
os.makedirs(IMAGE_DIR, exist_ok=True)

# Famous high-performance big bike models matching the website database
BIKE_MODELS = [
    "Yamaha YZF-R1", "Yamaha YZF-R3", "Yamaha YZF-R1 WorldSBK",
    "Honda CBR1000RR-R", "Honda CBR650R", "Honda CBR Sport Concept",
    "Kawasaki Ninja ZX-10RR", "Kawasaki Ninja ZX-10R", "Kawasaki Ninja ZX-10R ABS SE", 
    "Kawasaki Ninja 650", "Kawasaki Ninja H2R", "Kawasaki Ninja 400", "Kawasaki Z650", "Kawasaki Ninja 650 Sport",
    "Ducati Hypermotard 950", "Ducati Streetfighter V4", "Ducati Diavel 1260", "Ducati Panigale V4 Bagnaia",
    "Ducati Supersport 950 S", "Ducati Diavel V4", "Ducati Streetfighter V2",
    "Suzuki GSX-8R", "Suzuki GSX-S1000", "Suzuki Hayabusa", "Suzuki Hayabusa Blue Storm", "Suzuki GSX-R150",
    "BMW R1300 GS", "BMW R1250RS", "BMW M1000R",
    "Harley-Davidson Iron 883", "Harley-Davidson Street Bob 114", "Harley-Davidson Low Rider S"
]

# Mapping of bike models to search keywords for automatic compatibility matching
MODEL_KEYWORDS = {
    "Yamaha YZF-R1": ["r1", "yzf-r1"],
    "Yamaha YZF-R3": ["r3", "yzf-r3"],
    "Yamaha YZF-R1 WorldSBK": ["worldsbk", "pata"],
    "Honda CBR1000RR-R": ["cbr1000", "fireblade", "cbr1000rr"],
    "Honda CBR650R": ["cbr650", "cbr650r", "cb650r", "cb650"],
    "Honda CBR Sport Concept": ["cbr sport"],
    "Kawasaki Ninja ZX-10RR": ["zx-10rr", "zx10rr"],
    "Kawasaki Ninja ZX-10R": ["zx10r", "zx-10r", "zx 10r"],
    "Kawasaki Ninja ZX-10R ABS SE": ["zx-10r se", "zx10r se"],
    "Kawasaki Ninja 650": ["ninja 650", "ninja650"],
    "Kawasaki Ninja H2R": ["h2", "h2r", "supercharged"],
    "Kawasaki Ninja 400": ["ninja 400", "ninja400"],
    "Kawasaki Z650": ["z650"],
    "Kawasaki Ninja 650 Sport": ["ninja 650 sport"],
    "Ducati Hypermotard 950": ["hypermotard"],
    "Ducati Streetfighter V4": ["streetfighter v4"],
    "Ducati Diavel 1260": ["diavel 1260"],
    "Ducati Panigale V4 Bagnaia": ["panigale", "v4"],
    "Ducati Supersport 950 S": ["supersport 950"],
    "Ducati Diavel V4": ["diavel v4"],
    "Ducati Streetfighter V2": ["streetfighter v2"],
    "Suzuki GSX-8R": ["gsx-8r", "gsx8r"],
    "Suzuki GSX-S1000": ["gsx-s1000", "s1000"],
    "Suzuki Hayabusa": ["hayabusa", "busa"],
    "Suzuki Hayabusa Blue Storm": ["blue storm"],
    "Suzuki GSX-R150": ["gsx-r150", "gsxr150"],
    "BMW R1300 GS": ["r1300", "gs1300", "r1300gs"],
    "BMW R1250RS": ["r1250", "r1250rs"],
    "BMW M1000R": ["m1000r", "m1000"],
    "Harley-Davidson Iron 883": ["iron 883", "iron883", "sportster"],
    "Harley-Davidson Street Bob 114": ["street bob"],
    "Harley-Davidson Low Rider S": ["low rider", "lowrider"]
}

# Curated high-quality premium big bike accessories in English
FALLBACK_ACCESSORIES = [
    {
        "name": "Pirelli Diablo Supercorsa V3 TD Tire Set",
        "description": "The ultimate track day tire. High-performance profile derived from WSBK racing provides extreme cornering grip, swift warm-up, and top-tier durability at high speeds.",
        "price": 9500000.0,
        "stock": 15,
        "category": "Tires",
        "brand": "Pirelli",
        "imageUrl": "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Yamaha YZF-R1, Yamaha YZF-R1 WorldSBK, Honda CBR1000RR-R, Kawasaki Ninja ZX-10R, Kawasaki Ninja ZX-10RR, Ducati Panigale V4 Bagnaia, Suzuki Hayabusa, BMW M1000R"
    },
    {
        "name": "Akrapovic Evolution Line Titanium Exhaust System",
        "description": "Full racing exhaust crafted from ultra-lightweight titanium. Delivers remarkable power gains, significant weight reduction, and the iconic rich Akrapovic rumble.",
        "price": 68000000.0,
        "stock": 5,
        "category": "Exhaust",
        "brand": "Akrapovic",
        "imageUrl": "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Kawasaki Ninja H2R, Yamaha YZF-R1, Honda CBR1000RR-R, Ducati Panigale V4 Bagnaia, BMW M1000R"
    },
    {
        "name": "Ohlins TTX GP Rear Shock Absorber",
        "description": "State-of-the-art rear shock absorber with twin-tube TTX technology. Provides unmatched traction control and high-speed stability. Features full rebound and compression adjustments.",
        "price": 38000000.0,
        "stock": 8,
        "category": "Suspension",
        "brand": "Ohlins",
        "imageUrl": "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Ducati Panigale V4 Bagnaia, Ducati Streetfighter V4, Yamaha YZF-R1, Kawasaki Ninja ZX-10R, Honda CBR1000RR-R, BMW M1000R"
    },
    {
        "name": "DID 525 VX3 Gold Chain & JT Steel Sprocket Kit",
        "description": "Premium-grade gold chain with patented X-Ring seals for minimal friction and maximum wear life. Paired with laser-cut JT carbon steel sprockets.",
        "price": 2800000.0,
        "stock": 20,
        "category": "Chains & Sprockets",
        "brand": "DID",
        "imageUrl": "https://images.pexels.com/photos/159265/motorcycle-race-motorcycle-racing-track-159265.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Honda CBR650R, Kawasaki Ninja 650, Kawasaki Z650, Yamaha YZF-R3, Kawasaki Ninja 400, Suzuki GSX-8R"
    },
    {
        "name": "Rizoma Sport CNC Frame Sliders Set",
        "description": "Chassis protection machined from premium billet aluminum and high-density Delrin. Protects engine cases, fairings, and frame elements from slide damage.",
        "price": 4800000.0,
        "stock": 12,
        "category": "Frame Sliders",
        "brand": "Rizoma",
        "imageUrl": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Kawasaki Ninja 400, Yamaha YZF-R3, Honda CBR650R, Ducati Streetfighter V4, Ducati Streetfighter V2, Suzuki GSX-8R, Suzuki GSX-S1000"
    },
    {
        "name": "Brembo GP4-RX CNC Radial Brake Calipers",
        "description": "Nickel-plated racing calipers machined from solid aluminum. Feature four 32mm pistons for incredible stopping force and thermal dissipation.",
        "price": 45000000.0,
        "stock": 4,
        "category": "Brakes",
        "brand": "Brembo",
        "imageUrl": "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Yamaha YZF-R1, Honda CBR1000RR-R, Kawasaki Ninja ZX-10R, Ducati Panigale V4 Bagnaia, Suzuki Hayabusa, BMW M1000R"
    },
    {
        "name": "Shoei X-Fifteen Professional Racing Helmet",
        "description": "FIM-certified racing helmet developed for MotoGP. Advanced aerodynamic design reduces drag and lift, while offering optimal visibility and high-flow cooling channels.",
        "price": 21500000.0,
        "stock": 10,
        "category": "Helmets & Gear",
        "brand": "Shoei",
        "imageUrl": "https://images.pexels.com/photos/159265/motorcycle-race-motorcycle-racing-track-159265.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Universal Fit"
    },
    {
        "name": "Dainese Mugello 3 D-Air Leather Racing Suit",
        "description": "Professional-grade 1-piece leather suit crafted from premium kangaroo hide. Features integrated D-Air airbag protection system, titanium shoulder plates, and elasticated inserts.",
        "price": 85000000.0,
        "stock": 3,
        "category": "Helmets & Gear",
        "brand": "Dainese",
        "imageUrl": "https://images.pexels.com/photos/159265/motorcycle-race-motorcycle-racing-track-159265.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Universal Fit"
    },
    {
        "name": "Yoshimura Alpha T Carbon Fiber Slip-On Exhaust",
        "description": "Carbon fiber slip-on muffler designed to improve performance and enhance engine sound. Made with Yoshimura's works finish for maximum durability.",
        "price": 18500000.0,
        "stock": 8,
        "category": "Exhaust",
        "brand": "Yoshimura",
        "imageUrl": "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Suzuki GSX-R150, Kawasaki Ninja 400, Yamaha YZF-R3, Honda CBR650R, Suzuki GSX-8R"
    },
    {
        "name": "Puig Racing Windshield High Screen",
        "description": "Aerodynamically optimized double-bubble racing windscreen. Drastically reduces wind blast on the rider's helmet while maintaining crystal-clear visibility.",
        "price": 3200000.0,
        "stock": 15,
        "category": "Windshields",
        "brand": "Puig",
        "imageUrl": "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Yamaha YZF-R1, Honda CBR1000RR-R, Kawasaki Ninja ZX-10R, Ducati Panigale V4 Bagnaia, Yamaha YZF-R3, Kawasaki Ninja 400, Honda CBR650R"
    },
    {
        "name": "CRG Arrow Bar End Mirror Set",
        "description": "Ultra-sleek bar end mirrors CNC-machined from solid aluminum billet. High-grade convex anti-glare glass provides a clean, wide rearward field of view.",
        "price": 4200000.0,
        "stock": 25,
        "category": "Mirrors",
        "brand": "CRG",
        "imageUrl": "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Ducati Streetfighter V4, Ducati Streetfighter V2, BMW M1000R, Suzuki GSX-S1000, Kawasaki Z650, Harley-Davidson Iron 883, Harley-Davidson Street Bob 114, Harley-Davidson Low Rider S"
    },
    {
        "name": "Marchesini M7R Genesi Forged Aluminum Wheels",
        "description": "Ultra-lightweight 7-spoke forged aluminum racing wheels. Maximizes acceleration and cornering agility by drastically lowering rotational inertia and unsprung mass.",
        "price": 82000000.0,
        "stock": 3,
        "category": "Accessories",
        "brand": "Marchesini",
        "imageUrl": "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=800",
        "compatibleBikes": "Ducati Panigale V4 Bagnaia, Ducati Streetfighter V4, Yamaha YZF-R1, Kawasaki Ninja ZX-10R, Honda CBR1000RR-R, BMW M1000R"
    }
]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text).strip('_')
    return text

def parse_html_desc(html_content):
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    # Truncate and clean text
    text = soup.get_text(separator=" ").strip()
    text = re.sub(r'\s+', ' ', text)
    if len(text) > 220:
        text = text[:217] + "..."
    return text

def detect_brand(title, vendor):
    title_upper = title.upper()
    vendor_upper = vendor.upper() if vendor else ""
    
    for b in ["TST INDUSTRIES", "WOMET-TECH", "OHLINS", "BREMBO", "MICHELIN", "PIRELLI", "DID", "AKRAPOVIC", "RIZOMA", "BARRACUDA", "DAINESE", "SHOEI", "YOSHIMURA", "PUIG", "CRG", "MARCHESINI", "VORTEX", "EVOTECH", "K&N", "SENA", "ALPINESTARS"]:
        if b in title_upper or b in vendor_upper:
            # Capitalize nicely
            return b.title()
    
    return vendor if vendor else "Aftermarket"

def detect_category(title, product_type):
    title_lower = title.lower()
    pt_lower = product_type.lower() if product_type else ""
    search_str = f"{title_lower} {pt_lower}"
    
    if any(k in search_str for k in ["exhaust", "muffler", "headers", "slip-on"]):
        return "Exhaust"
    if any(k in search_str for k in ["tire", "tyre", "wheel"]):
        return "Tires"
    if any(k in search_str for k in ["shock", "fork", "suspension", "spring"]):
        return "Suspension"
    if any(k in search_str for k in ["chain", "sprocket", "drive"]):
        return "Chains & Sprockets"
    if any(k in search_str for k in ["slider", "crash", "guard", "protector", "cover"]):
        return "Frame Sliders"
    if any(k in search_str for k in ["brake", "caliper", "lever", "rotor", "pad"]):
        return "Brakes"
    if any(k in search_str for k in ["helmet", "apparel", "jacket", "glove", "suit", "boots", "shirt"]):
        return "Helmets & Gear"
    if any(k in search_str for k in ["light", "signal", "led", "headlight", "taillight"]):
        return "Lighting"
    if any(k in search_str for k in ["fender", "eliminator", "license", "tail tidy"]):
        return "Fender Eliminators"
    if any(k in search_str for k in ["mirror", "bar end"]):
        return "Mirrors"
        
    return "Accessories"

def match_compatibility(title, tags=None):
    title_lower = title.lower()
    tag_str = " ".join([t.lower() for t in tags]) if tags else ""
    search_str = f"{title_lower} {tag_str}"
    
    compatibles = []
    for model, keywords in MODEL_KEYWORDS.items():
        for kw in keywords:
            # Word boundary check to prevent R1 matching R150 or Z650 matching Z6500
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, search_str) or (kw in search_str and len(kw) > 3):
                compatibles.append(model)
                break
                
    if not compatibles:
        return "Universal Fit"
    return ", ".join(compatibles)

def download_image(url, name):
    filename = f"{slugify(name)}.png"
    filepath = os.path.join(IMAGE_DIR, filename)
    db_path = f"/images/accessories/{filename}"
    
    # Check if cached to optimize speed
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        return db_path
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"[*] Cached: {name} -> {filename}")
            return db_path
    except Exception as e:
        print(f"[!] Image download failed: {url} : {e}")
        
    # Return source URL if download fails
    return url

def fetch_shopify_products(domain):
    url = f"https://{domain}/products.json?limit=150"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    print(f"Fetching products from {domain}...")
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            return response.json().get("products", [])
    except Exception as e:
        print(f"Error fetching from {domain}: {e}")
    return []

def main():
    scraped_products = []
    
    # 1. Fetch from TST Industries (excellent sport bike focus)
    tst_products = fetch_shopify_products("tstindustries.com")
    # 2. Fetch from Steady Garage (premium universal accessories & parts)
    sg_products = fetch_shopify_products("www.steadygarage.com")
    
    combined = tst_products + sg_products
    print(f"Total raw products fetched from Shopify: {len(combined)}")
    
    for item in combined:
        title = item.get("title", "")
        vendor = item.get("vendor", "")
        product_type = item.get("product_type", "")
        body_html = item.get("body_html", "")
        tags = item.get("tags", [])
        
        # Get variants (price)
        variants = item.get("variants", [])
        if not variants:
            continue
        price_usd = float(variants[0].get("price", 0.0))
        if price_usd <= 0:
            continue
            
        # Convert USD to VND (rate 25000) and round to nearest 10k
        price_vnd = round(price_usd * 25000, -4)
        
        # Map to bike models
        compat = match_compatibility(title, tags)
        
        # We prefer items that match our bike models specifically, or high-value universal parts.
        # Skip cheap brackets, hardware bolts, or items under $15 to keep the store feeling premium.
        if compat == "Universal Fit" and price_usd < 25.0:
            continue
            
        desc = parse_html_desc(body_html)
        if not desc:
            desc = f"Premium quality {title} by {vendor}. Unlocks performance and stylistic enhancement for your sport bike."
            
        brand = detect_brand(title, vendor)
        category = detect_category(title, product_type)
        
        # Get first image
        images = item.get("images", [])
        img_url = images[0].get("src") if images else ""
        if not img_url:
            continue
            
        scraped_products.append({
            "name": title,
            "description": desc,
            "price": price_vnd,
            "stock": 25,
            "category": category,
            "brand": brand,
            "imageUrl": img_url,  # To be downloaded
            "compatibleBikes": compat
        })
        
    print(f"Filtered down to {len(scraped_products)} high-quality premium products.")
    
    # De-duplicate by name
    seen_names = set()
    unique_scraped = []
    for p in scraped_products:
        name_clean = p["name"].lower().strip()
        if name_clean not in seen_names:
            seen_names.add(name_clean)
            unique_scraped.append(p)
            
    print(f"Unique products count: {len(unique_scraped)}")
    
    # 3. Combine with Fallback list
    # If Shopify scraping succeeded and we got products, we prioritize them, 
    # but also make sure we include our core 12 premium accessories.
    final_raw_list = FALLBACK_ACCESSORIES.copy()
    
    # Merge unique scraped items into the final list
    for p in unique_scraped:
        if len(final_raw_list) >= 300:
            break
        # Avoid duplicating fallbacks
        if not any(f["name"].lower().strip() == p["name"].lower().strip() for f in final_raw_list):
            final_raw_list.append(p)
            
    print(f"Final catalog size to compile: {len(final_raw_list)}")
    
    # Process images and compile json
    json_accessories = []
    for index, item in enumerate(final_raw_list):
        print(f"[{index + 1}/{len(final_raw_list)}] Processing: {item['name']}")
        local_img = download_image(item["imageUrl"], item["name"])
        
        json_accessories.append({
            "name": item["name"],
            "description": item["description"],
            "price": item["price"],
            "stock": item["stock"],
            "category": item["category"],
            "brand": item["brand"],
            "imageUrl": local_img,
            "compatibleBikes": item["compatibleBikes"],
            "isActive": True
        })
        
    # Write JSON output
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_accessories, f, ensure_ascii=False, indent=2)
        
    print(f"\n==================================================")
    print(f"Done! Scraped English accessories catalog saved successfully!")
    print(f"JSON Data: {JSON_PATH}")
    print(f"Downloaded Images Location: {IMAGE_DIR}")
    print(f"Total Seeded items: {len(json_accessories)}")
    print(f"==================================================")

if __name__ == "__main__":
    main()
