import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(BASE_DIR, "src", "main", "resources", "static", "images", "motorcycles")
JSON_PATH = os.path.join(BASE_DIR, "src", "main", "resources", "motorcycles.json")

# Ensure target directories exist
os.makedirs(IMAGE_DIR, exist_ok=True)

# Curated list of 50 premium motorcycle specifications in English
MOTORCYCLE_CATALOG = [
    # ============ YAMAHA (6) ============
    {
        "brand": "YAMAHA", "model": "YZF-R3", "year": 2024, "category": "Sport", "price": 129000000.0,
        "description": "Yamaha R3 with custom black, blue, and gold livery. Perfect entry-level sportbike.",
        "engineType": "321cc Parallel Twin", "displacement": 321, "power": 42.0, "torque": 39.7, "weight": 169.0, "topSpeed": 186.0, "fuelCapacity": 14.0, "stock": 8,
        "features": ["Slipper Clutch", "LED Lighting", "Digital Display", "ABS"], "color": "Black/Blue/Gold"
    },
    {
        "brand": "YAMAHA", "model": "YZF-R1", "year": 2025, "category": "Sport", "price": 549000000.0,
        "description": "2025 Yamaha YZF-R1 in Tech Black. The pinnacle of superbike performance.",
        "engineType": "998cc Inline-4", "displacement": 998, "power": 200.0, "torque": 112.4, "weight": 199.0, "topSpeed": 299.0, "fuelCapacity": 17.0, "stock": 3,
        "features": ["Crossplane Engine", "6-Axis IMU", "Quickshifter", "Cornering ABS", "Traction Control"], "color": "Tech Black"
    },
    {
        "brand": "YAMAHA", "model": "YZF-R1 WorldSBK", "year": 2025, "category": "Sport", "price": 679000000.0,
        "description": "Yamaha YZF-R1 WorldSBK Edition with Pata Yamaha racing livery. Limited edition.",
        "engineType": "998cc Inline-4", "displacement": 998, "power": 200.0, "torque": 112.4, "weight": 199.0, "topSpeed": 299.0, "fuelCapacity": 17.0, "stock": 2,
        "features": ["Racing Livery", "Öhlins Suspension", "Akrapovic Exhaust", "Carbon Fiber Parts"], "color": "Pata Blue"
    },
    {
        "brand": "YAMAHA", "model": "YZF-R7", "year": 2024, "category": "Sport", "price": 269000000.0,
        "description": "2024 Yamaha YZF-R7 in Icon Blue. Combines sleek bodywork and a torque-rich CP2 engine.",
        "engineType": "689cc Parallel Twin", "displacement": 689, "power": 73.4, "torque": 67.0, "weight": 188.0, "topSpeed": 230.0, "fuelCapacity": 13.0, "stock": 5,
        "features": ["Assist & Slipper Clutch", "Upside Down Forks", "ABS", "LED Projector Headlight"], "color": "Icon Blue"
    },
    {
        "brand": "YAMAHA", "model": "MT-09", "year": 2024, "category": "Naked", "price": 349000000.0,
        "description": "Yamaha MT-09 hyper-naked motorcycle. Aggressive styling and torque-heavy CP3 engine.",
        "engineType": "890cc Inline-3", "displacement": 890, "power": 119.0, "torque": 93.0, "weight": 189.0, "topSpeed": 225.0, "fuelCapacity": 14.0, "stock": 6,
        "features": ["Quickshifter", "Traction Control", "Wheelie Control", "TFT Color Display"], "color": "Cyan Storm"
    },
    {
        "brand": "YAMAHA", "model": "MT-03", "year": 2024, "category": "Naked", "price": 124000000.0,
        "description": "Yamaha MT-03 entry naked street fighter. Nimble chassis and twin-cylinder motor.",
        "engineType": "321cc Parallel Twin", "displacement": 321, "power": 42.0, "torque": 29.6, "weight": 168.0, "topSpeed": 170.0, "fuelCapacity": 14.0, "stock": 10,
        "features": ["ABS", "Monoshock Rear Suspension", "LCD Instrument Cluster", "LED DRLs"], "color": "Midnight Black"
    },

    # ============ HONDA (6) ============
    {
        "brand": "HONDA", "model": "CBR650R", "year": 2024, "category": "Sport", "price": 259000000.0,
        "description": "Honda CBR650R in matte gunpowder black metallic. Perfect mid-weight sportbike.",
        "engineType": "649cc Inline-4", "displacement": 649, "power": 95.0, "torque": 64.0, "weight": 208.0, "topSpeed": 230.0, "fuelCapacity": 15.4, "stock": 7,
        "features": ["Showa Suspension", "ABS", "LED Lighting", "Digital Display"], "color": "Matte Gunpowder Black"
    },
    {
        "brand": "HONDA", "model": "CBR Sport Concept", "year": 2024, "category": "Sport", "price": 189000000.0,
        "description": "Honda Light Weight Super Sports Concept. Next-generation sport bike design.",
        "engineType": "500cc Parallel Twin", "displacement": 500, "power": 47.0, "torque": 43.0, "weight": 166.0, "topSpeed": 200.0, "fuelCapacity": 13.0, "stock": 10,
        "features": ["Concept Design", "LED Matrix", "Ride-by-Wire", "Cornering ABS"], "color": "Carbon Black"
    },
    {
        "brand": "HONDA", "model": "CBR1000RR-R", "year": 2026, "category": "Sport", "price": 789000000.0,
        "description": "2026 Honda CBR1000RR-R Fireblade SP in pearl white. Race-bred superbike.",
        "engineType": "999cc Inline-4", "displacement": 999, "power": 217.0, "torque": 113.0, "weight": 201.0, "topSpeed": 299.0, "fuelCapacity": 16.1, "stock": 4,
        "features": ["Öhlins Electronic Suspension", "Brembo Stylema Brakes", "Quickshifter", "Launch Control"], "color": "Pearl White"
    },
    {
        "brand": "HONDA", "model": "CRF300L", "year": 2024, "category": "Adventure", "price": 169000000.0,
        "description": "Honda CRF300L dual-sport adventure motorcycle. Perfect for trail riding and city commuting.",
        "engineType": "286cc Single Cylinder", "displacement": 286, "power": 27.3, "torque": 26.6, "weight": 142.0, "topSpeed": 140.0, "fuelCapacity": 7.8, "stock": 4,
        "features": ["Spoke Wheels", "Long Travel Suspension", "Digital Display", "Assist/Slipper Clutch"], "color": "Extreme Red"
    },
    {
        "brand": "HONDA", "model": "CB650R", "year": 2024, "category": "Naked", "price": 244000000.0,
        "description": "Honda CB650R Neo Sports Cafe naked bike. Inline-4 engine with retro-modern design.",
        "engineType": "649cc Inline-4", "displacement": 649, "power": 95.0, "torque": 64.0, "weight": 202.0, "topSpeed": 220.0, "fuelCapacity": 15.4, "stock": 6,
        "features": ["Neo Sports Cafe Styling", "Honda Selectable Torque Control", "ABS", "Showa SFF-BP Forks"], "color": "Candy Chromosphere Red"
    },
    {
        "brand": "HONDA", "model": "Transalp 750", "year": 2024, "category": "Adventure", "price": 309000000.0,
        "description": "Honda XL750 Transalp adventure tourer. Ready for offroad trails or highway touring.",
        "engineType": "755cc Parallel Twin", "displacement": 755, "power": 90.5, "torque": 75.0, "weight": 208.0, "topSpeed": 210.0, "fuelCapacity": 16.9, "stock": 5,
        "features": ["Riding Modes", "Spoke Wheels", "Traction Control", "TFT Instrument Console"], "color": "Ross White"
    },

    # ============ KAWASAKI (8) ============
    {
        "brand": "KAWASAKI", "model": "Ninja ZX-10RR", "year": 2017, "category": "Sport", "price": 589000000.0,
        "description": "2017 Kawasaki Ninja ZX-10RR Winter Test Edition. Track-focused superbike.",
        "engineType": "998cc Inline-4", "displacement": 998, "power": 197.0, "torque": 114.0, "weight": 207.0, "topSpeed": 299.0, "fuelCapacity": 17.0, "stock": 2,
        "features": ["Race Kit", "Öhlins Suspension", "Marchesini Wheels", "Quickshifter"], "color": "Black/Green"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja ZX-10R", "year": 2024, "category": "Sport", "price": 529000000.0,
        "description": "Kawasaki Ninja ZX-10R in iconic Kawasaki lime green. Championship-winning DNA.",
        "engineType": "998cc Inline-4", "displacement": 998, "power": 197.0, "torque": 114.0, "weight": 207.0, "topSpeed": 299.0, "fuelCapacity": 17.0, "stock": 5,
        "features": ["Kawasaki Traction Control", "Cornering ABS", "Quickshifter", "Launch Control"], "color": "Lime Green"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja ZX-10R ABS SE", "year": 2024, "category": "Sport", "price": 549000000.0,
        "description": "Ninja ZX-10R ABS with gold accents and special edition graphics.",
        "engineType": "998cc Inline-4", "displacement": 998, "power": 197.0, "torque": 114.0, "weight": 207.0, "topSpeed": 299.0, "fuelCapacity": 17.0, "stock": 3,
        "features": ["Gold Wheels", "SE Graphics", "Öhlins", "Brembo", "Carbon Parts"], "color": "Green/Gold"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja 650", "year": 2021, "category": "Sport", "price": 229000000.0,
        "description": "2021 Kawasaki Ninja 650 with signature green trellis frame. Perfect middleweight.",
        "engineType": "649cc Parallel Twin", "displacement": 649, "power": 68.0, "torque": 64.0, "weight": 193.0, "topSpeed": 210.0, "fuelCapacity": 15.0, "stock": 12,
        "features": ["Slipper Clutch", "ABS", "LED Lighting", "Digital Display"], "color": "Black/Green"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja H2R", "year": 2024, "category": "Sport", "price": 1599000000.0,
        "description": "Kawasaki Ninja H2R. Track-only supercharged hyperbike. 300+ hp.",
        "engineType": "998cc Supercharged Inline-4", "displacement": 998, "power": 310.0, "torque": 165.0, "weight": 216.0, "topSpeed": 400.0, "fuelCapacity": 17.0, "stock": 1,
        "features": ["Supercharged", "Track Only", "Carbon Fiber Wings", "Öhlins", "Brembo"], "color": "Mirror Silver"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja 400", "year": 2024, "category": "Sport", "price": 159000000.0,
        "description": "Kawasaki Ninja 400 in all black. Perfect beginner sportbike with big bike feel.",
        "engineType": "399cc Parallel Twin", "displacement": 399, "power": 45.0, "torque": 38.0, "weight": 168.0, "topSpeed": 190.0, "fuelCapacity": 14.0, "stock": 15,
        "features": ["Slipper Clutch", "ABS", "LED Lighting", "Assist Clutch"], "color": "Metallic Black"
    },
    {
        "brand": "KAWASAKI", "model": "Z650", "year": 2024, "category": "Naked", "price": 239000000.0,
        "description": "Kawasaki Z650 naked sport with distinctive green accents. Nimble and fun.",
        "engineType": "649cc Parallel Twin", "displacement": 649, "power": 68.0, "torque": 64.0, "weight": 187.0, "topSpeed": 200.0, "fuelCapacity": 15.0, "stock": 10,
        "features": ["Sugomi Design", "Slipper Clutch", "ABS", "TFT Display"], "color": "Metallic Green"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja 650 Sport", "year": 2024, "category": "Sport", "price": 239000000.0,
        "description": "Kawasaki Ninja 650 in lime green livery. The most popular middleweight sport bike.",
        "engineType": "649cc Parallel Twin", "displacement": 649, "power": 68.0, "torque": 64.0, "weight": 193.0, "topSpeed": 210.0, "fuelCapacity": 15.0, "stock": 8,
        "features": ["Slipper Clutch", "Kawasaki TRaction Control", "ABS", "LED Lights"], "color": "Lime Green"
    },
    {
        "brand": "KAWASAKI", "model": "ZX-4RR", "year": 2024, "category": "Sport", "price": 255000000.0,
        "description": "Kawasaki Ninja ZX-4RR inline-four screamer. 400cc class racing performance.",
        "engineType": "399cc Inline-4", "displacement": 399, "power": 77.0, "torque": 39.0, "weight": 188.0, "topSpeed": 240.0, "fuelCapacity": 15.0, "stock": 4,
        "features": ["16,000 RPM Redline", "Quickshifter", "Showa Showa SFF-BP Forks", "Ram Air System"], "color": "Lime Green/Ebony"
    },
    {
        "brand": "KAWASAKI", "model": "Ninja 500", "year": 2024, "category": "Sport", "price": 184000000.0,
        "description": "Kawasaki Ninja 500. Upgraded middleweight sport champion, perfect daily rider.",
        "engineType": "451cc Parallel Twin", "displacement": 451, "power": 52.0, "torque": 43.0, "weight": 171.0, "topSpeed": 195.0, "fuelCapacity": 14.0, "stock": 7,
        "features": ["ABS", "LED Headlights", "LCD Instrument Console", "Slipper Clutch"], "color": "Metallic Matte Dark Gray"
    },

    # ============ DUCATI (9) ============
    {
        "brand": "DUCATI", "model": "Hypermotard 950", "year": 2024, "category": "Naked", "price": 449000000.0,
        "description": "Ducati Hypermotard 950 in red and white. The ultimate fun machine.",
        "engineType": "937cc L-Twin", "displacement": 937, "power": 114.0, "torque": 96.0, "weight": 178.0, "topSpeed": 215.0, "fuelCapacity": 14.5, "stock": 6,
        "features": ["Ducati Traction Control", "Cornering ABS", "Ride Modes", "TFT Display"], "color": "Ducati Red/White"
    },
    {
        "brand": "DUCATI", "model": "Streetfighter V4", "year": 2024, "category": "Naked", "price": 649000000.0,
        "description": "Ducati Streetfighter V4. Fighter of the Year with 208 hp V4 engine.",
        "engineType": "1103cc V4", "displacement": 1103, "power": 208.0, "torque": 123.0, "weight": 178.0, "topSpeed": 280.0, "fuelCapacity": 16.0, "stock": 3,
        "features": ["V4 Engine", "Öhlins", "Brembo Stylema", "Cornering ABS", "Wheelie Control"], "color": "Ducati Red"
    },
    {
        "brand": "DUCATI", "model": "Diavel 1260", "year": 2024, "category": "Cruiser", "price": 579000000.0,
        "description": "Ducati Diavel 1260. Power cruiser with 162 hp Testastretta DVT engine.",
        "engineType": "1262cc L-Twin", "displacement": 1262, "power": 162.0, "torque": 129.0, "weight": 247.0, "topSpeed": 260.0, "fuelCapacity": 17.0, "stock": 4,
        "features": ["DVT Engine", "Cruise Control", "Cornering Lights", "Riding Modes"], "color": "Thrilling Black"
    },
    {
        "brand": "DUCATI", "model": "Panigale V4 Bagnaia", "year": 2024, "category": "Sport", "price": 1299000000.0,
        "description": "Ducati Panigale V4 with Bagnaia World Champion livery. Limited edition.",
        "engineType": "1103cc V4", "displacement": 1103, "power": 214.0, "torque": 124.0, "weight": 174.0, "topSpeed": 299.0, "fuelCapacity": 16.0, "stock": 1,
        "features": ["Race Livery", "Öhlins Smart EC 2.0", "Brembo Stylema R", "Carbon Fiber"], "color": "Bagnaia Yellow"
    },
    {
        "brand": "DUCATI", "model": "Supersport 950 S", "year": 2024, "category": "Sport", "price": 489000000.0,
        "description": "Ducati Supersport 950 S in Ducati red. Sport bike comfort meets superbike performance.",
        "engineType": "937cc L-Twin", "displacement": 937, "power": 110.0, "torque": 93.0, "weight": 184.0, "topSpeed": 240.0, "fuelCapacity": 16.0, "stock": 7,
        "features": ["Öhlins Suspension", "Quickshifter", "Riding Modes", "Cornering ABS"], "color": "Ducati Red"
    },
    {
        "brand": "DUCATI", "model": "Diavel V4", "year": 2024, "category": "Cruiser", "price": 749000000.0,
        "description": "Ducati Diavel V4 in bright red. The most powerful Diavel ever made.",
        "engineType": "1158cc V4 Granturismo", "displacement": 1158, "power": 168.0, "torque": 126.0, "weight": 218.0, "topSpeed": 270.0, "fuelCapacity": 18.0, "stock": 3,
        "features": ["V4 Granturismo", "Radar Adaptive Cruise Control", "Cornering Lights", "TFT Display"], "color": "Ducati Red"
    },
    {
        "brand": "DUCATI", "model": "Streetfighter V2", "year": 2024, "category": "Naked", "price": 529000000.0,
        "description": "Ducati Streetfighter V2. Compact fighter with 155 hp Superquadro engine.",
        "engineType": "955cc L-Twin", "displacement": 955, "power": 155.0, "torque": 104.0, "weight": 178.0, "topSpeed": 250.0, "fuelCapacity": 17.0, "stock": 5,
        "features": ["Superquadro Engine", "Electronic Suspension", "Cornering ABS", "Wheelie Control"], "color": "Ducati Red/Black"
    },
    {
        "brand": "DUCATI", "model": "Monster 937", "year": 2024, "category": "Naked", "price": 439000000.0,
        "description": "Ducati Monster 937 naked bike. Lightweight aluminum frame and sporty performance.",
        "engineType": "937cc Testastretta 11°", "displacement": 937, "power": 111.0, "torque": 93.0, "weight": 166.0, "topSpeed": 225.0, "fuelCapacity": 14.0, "stock": 4,
        "features": ["Launch Control", "Ducati Quick Shift", "Cornering ABS", "Wheelie Control"], "color": "Aviator Grey"
    },
    {
        "brand": "DUCATI", "model": "DesertX", "year": 2024, "category": "Adventure", "price": 649000000.0,
        "description": "Ducati DesertX adventure tourer. Off-road rally champion with legendary Testastretta power.",
        "engineType": "937cc L-Twin", "displacement": 937, "power": 110.0, "torque": 92.0, "weight": 202.0, "topSpeed": 200.0, "fuelCapacity": 21.0, "stock": 2,
        "features": ["21/18-inch Spoke Wheels", "Kayaba Long-Travel Suspension", "Brembo Brakes", "6 Riding Modes"], "color": "Star White Silk"
    },

    # ============ SUZUKI (7) ============
    {
        "brand": "SUZUKI", "model": "GSX-8R", "year": 2024, "category": "Sport", "price": 329000000.0,
        "description": "Suzuki GSX-8R in yellow limited edition. All-new parallel twin sportbike.",
        "engineType": "776cc Parallel Twin", "displacement": 776, "power": 83.0, "torque": 78.0, "weight": 178.0, "topSpeed": 220.0, "fuelCapacity": 14.0, "stock": 8,
        "features": ["New Parallel Twin", "Traction Control", "ABS", "Quickshifter"], "color": "Kiiro Yellow"
    },
    {
        "brand": "SUZUKI", "model": "GSX-S1000", "year": 2024, "category": "Naked", "price": 459000000.0,
        "description": "Suzuki GSX-S1000 in blue. Superbike-derived engine in a naked package.",
        "engineType": "999cc Inline-4", "displacement": 999, "power": 152.0, "torque": 106.0, "weight": 209.0, "topSpeed": 260.0, "fuelCapacity": 19.0, "stock": 6,
        "features": ["GSX-R Derived Engine", "Traction Control", "ABS", "Ride Modes"], "color": "Triton Blue"
    },
    {
        "brand": "SUZUKI", "model": "Hayabusa", "year": 2024, "category": "Sport", "price": 749000000.0,
        "description": "Suzuki Hayabusa in gray/green. The legendary ultimate sport bike returns.",
        "engineType": "1340cc Inline-4", "displacement": 1340, "power": 190.0, "torque": 150.0, "weight": 264.0, "topSpeed": 299.0, "fuelCapacity": 20.0, "stock": 2,
        "features": ["Launch Control", "Anti-Lift Control", "Active Speed Limiter", "Cruise Control"], "color": "Metallic Gray/Green"
    },
    {
        "brand": "SUZUKI", "model": "Hayabusa Blue Storm", "year": 2024, "category": "Sport", "price": 769000000.0,
        "description": "Suzuki Hayabusa in Blue Storm metallic. The king of speed with refined power.",
        "engineType": "1340cc Inline-4", "displacement": 1340, "power": 190.0, "torque": 150.0, "weight": 264.0, "topSpeed": 299.0, "fuelCapacity": 20.0, "stock": 3,
        "features": ["Launch Control", "Electronic Suspension", "Brembo Brakes", "LED Matrix"], "color": "Blue Storm Metallic"
    },
    {
        "brand": "SUZUKI", "model": "GSX-R150", "year": 2024, "category": "Sport", "price": 75000000.0,
        "description": "Suzuki GSX-R150 with MotoGP livery. Entry-level sportbike with race DNA.",
        "engineType": "147cc Single", "displacement": 147, "power": 19.2, "torque": 14.0, "weight": 134.0, "topSpeed": 145.0, "fuelCapacity": 11.0, "stock": 20,
        "features": ["Keyless Ignition", "LED Lights", "Digital Display", "USD Forks"], "color": "MotoGP Blue"
    },
    {
        "brand": "SUZUKI", "model": "GSX-8S", "year": 2024, "category": "Naked", "price": 299000000.0,
        "description": "Suzuki GSX-8S naked street fighter. Innovative CP2 alternative twin with balanced handling.",
        "engineType": "776cc Parallel Twin", "displacement": 776, "power": 83.0, "torque": 78.0, "weight": 202.0, "topSpeed": 215.0, "fuelCapacity": 14.0, "stock": 7,
        "features": ["Bi-Directional Quickshifter", "Suzuki Drive Mode Selector", "ABS", "LED Projector Stack"], "color": "Pearl Cosmic Blue"
    },
    {
        "brand": "SUZUKI", "model": "Katana", "year": 2024, "category": "Naked", "price": 499000000.0,
        "description": "Suzuki Katana. Modern rebirth of a legendary retro sport touring icon.",
        "engineType": "999cc Inline-4", "displacement": 999, "power": 150.0, "torque": 108.0, "weight": 215.0, "topSpeed": 250.0, "fuelCapacity": 12.0, "stock": 2,
        "features": ["Retro Styling", "Slipper Clutch", "Easy Start System", "Multi-stage Traction Control"], "color": "Mystic Silver"
    },

    # ============ BMW (5) ============
    {
        "brand": "BMW", "model": "R1300 GS", "year": 2024, "category": "Adventure", "price": 829000000.0,
        "description": "BMW R1300 GS in racing green. The ultimate adventure motorcycle.",
        "engineType": "1300cc Boxer Twin", "displacement": 1300, "power": 145.0, "torque": 149.0, "weight": 239.0, "topSpeed": 220.0, "fuelCapacity": 19.0, "stock": 4,
        "features": ["Adaptive Ride Height", "Dynamic ESA", "Cornering ABS", "Radar Cruise Control"], "color": "Racing Green"
    },
    {
        "brand": "BMW", "model": "R1250RS", "year": 2024, "category": "Sport Touring", "price": 659000000.0,
        "description": "BMW R1250RS in black. Premium sport touring with boxer engine.",
        "engineType": "1254cc Boxer Twin", "displacement": 1254, "power": 136.0, "torque": 143.0, "weight": 224.0, "topSpeed": 220.0, "fuelCapacity": 18.0, "stock": 5,
        "features": ["ShiftCam Technology", "Dynamic ESA", "Cruise Control", "Heated Grips"], "color": "Black Storm Metallic"
    },
    {
        "brand": "BMW", "model": "M1000R", "year": 2024, "category": "Naked", "price": 749000000.0,
        "description": "BMW M1000R. The first M naked bike with 210 hp from S1000RR.",
        "engineType": "999cc Inline-4", "displacement": 999, "power": 210.0, "torque": 113.0, "weight": 192.0, "topSpeed": 280.0, "fuelCapacity": 16.5, "stock": 2,
        "features": ["M Package", "Carbon Wheels", "M Chassis", "Launch Control", "Wheelie Control"], "color": "M Motorsport"
    },
    {
        "brand": "BMW", "model": "S1000RR", "year": 2024, "category": "Sport", "price": 899000000.0,
        "description": "BMW S1000RR. German superbike benchmark featuring ShiftCam engine tech.",
        "engineType": "999cc Inline-4", "displacement": 999, "power": 205.0, "torque": 113.0, "weight": 197.0, "topSpeed": 299.0, "fuelCapacity": 16.5, "stock": 3,
        "features": ["Dynamic Damping Control", "M Carbon Wheels", "ShiftCam Technology", "Dynamic Traction Control"], "color": "Lightwhite Uni/M Motorsport"
    },
    {
        "brand": "BMW", "model": "F900XR", "year": 2024, "category": "Sport Touring", "price": 439000000.0,
        "description": "BMW F900XR mid-weight adventure sports tourer. Agile handling and comfortable ergonomics.",
        "engineType": "895cc Parallel Twin", "displacement": 895, "power": 99.0, "torque": 92.0, "weight": 219.0, "topSpeed": 200.0, "fuelCapacity": 15.5, "stock": 4,
        "features": ["Adaptive Headlights", "Dynamic ESA", "Connectivity TFT Dash", "Cornering ABS"], "color": "Racing Red"
    },

    # ============ HARLEY-DAVIDSON (4) ============
    {
        "brand": "HARLEY-DAVIDSON", "model": "Iron 883", "year": 2024, "category": "Cruiser", "price": 379000000.0,
        "description": "Harley-Davidson Iron 883 in black denim. Classic bobber styling.",
        "engineType": "883cc V-Twin", "displacement": 883, "power": 50.0, "torque": 69.0, "weight": 256.0, "topSpeed": 180.0, "fuelCapacity": 12.5, "stock": 8,
        "features": ["Evolution Engine", "Low Seat Height", "Chopped Fenders", "Dark Custom"], "color": "Black Denim"
    },
    {
        "brand": "HARLEY-DAVIDSON", "model": "Street Bob 114", "year": 2024, "category": "Cruiser", "price": 649000000.0,
        "description": "Harley-Davidson Street Bob 114 in red. Milwaukee-Eight 114 power.",
        "engineType": "1868cc V-Twin", "displacement": 1868, "power": 94.0, "torque": 155.0, "weight": 296.0, "topSpeed": 190.0, "fuelCapacity": 13.6, "stock": 5,
        "features": ["Milwaukee-Eight 114", "Inverted Forks", "Monoshock", "LED Lights"], "color": "Billiard Red"
    },
    {
        "brand": "HARLEY-DAVIDSON", "model": "Low Rider S", "year": 2024, "category": "Cruiser", "price": 699000000.0,
        "description": "Harley-Davidson Low Rider S in vivid black. High-performance cruiser.",
        "engineType": "1923cc V-Twin", "displacement": 1923, "power": 92.0, "torque": 161.0, "weight": 302.0, "topSpeed": 185.0, "fuelCapacity": 18.9, "stock": 4,
        "features": ["Milwaukee-Eight 117", "Screamin' Eagle", "Premium Suspension", "Touring Ready"], "color": "Vivid Black"
    },
    {
        "brand": "HARLEY-DAVIDSON", "model": "Pan America 1250", "year": 2024, "category": "Adventure", "price": 869000000.0,
        "description": "Harley-Davidson Pan America 1250 Special. Revolutionary liquid-cooled adventure bike.",
        "engineType": "1252cc Revolution Max 1250T", "displacement": 1252, "power": 150.0, "torque": 128.0, "weight": 258.0, "topSpeed": 220.0, "fuelCapacity": 21.2, "stock": 2,
        "features": ["Adaptive Ride Height", "Revolution Max 1250T", "Semi-Active Suspension", "TFT Color Touchscreen"], "color": "Baja Orange/Stone Washed White"
    },

    # ============ OTHER PREMIUM BRANDS (3) ============
    {
        "brand": "TRIUMPH", "model": "Street Triple 765 RS", "year": 2024, "category": "Naked", "price": 419000000.0,
        "description": "Triumph Street Triple 765 RS. The class-leading naked bike with Moto2 engine DNA.",
        "engineType": "765cc Inline-3", "displacement": 765, "power": 130.0, "torque": 80.0, "weight": 188.0, "topSpeed": 245.0, "fuelCapacity": 15.0, "stock": 3,
        "features": ["Moto2 Derived Engine", "Brembo Stylema Calipers", "Öhlins Rear Shock", "Up/Down Quickshifter"], "color": "Silver Ice"
    },
    {
        "brand": "TRIUMPH", "model": "Tiger 900 Rally Pro", "year": 2024, "category": "Adventure", "price": 489000000.0,
        "description": "Triumph Tiger 900 Rally Pro adventure bike. Engineered for extreme off-road exploration.",
        "engineType": "888cc Inline-3", "displacement": 888, "power": 108.0, "torque": 90.0, "weight": 201.0, "topSpeed": 210.0, "fuelCapacity": 20.0, "stock": 3,
        "features": ["Show Suspension (240mm travel)", "Tubeless Spoke Wheels", "Riding Modes", "Heated Seats"], "color": "Sandstorm"
    },
    {
        "brand": "KTM", "model": "1290 Super Duke R", "year": 2024, "category": "Naked", "price": 689000000.0,
        "description": "KTM 1290 Super Duke R EVO. 'The Beast' - extreme power, high-tech active suspension.",
        "engineType": "1301cc V-Twin", "displacement": 1301, "power": 180.0, "torque": 140.0, "weight": 189.0, "topSpeed": 290.0, "fuelCapacity": 16.0, "stock": 2,
        "features": ["WP Semi-Active Suspension", "KTM Ride Mode Pro", "MSC (Motorcycle Stability Control)", "TFT Connectivity"], "color": "KTM Orange/Blue"
    }
]

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '_', text).strip('_')
    return text

def download_image(url, filename):
    filepath = os.path.join(IMAGE_DIR, filename)
    db_path = f"/images/motorcycles/{filename}"
    
    # Check if cached to optimize speed
    if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
        return db_path
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=12)
        if response.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"[*] Downloaded: {filename}")
            return db_path
    except Exception as e:
        print(f"[!] Image download failed: {url} : {e}")
        
    return None

PRE_EXISTING_IMAGES = {
    ("YAMAHA", "YZF-R3"): "/images/motorcycles/rbk-t1-yamaha-r3-black-blue-gold-render.webp",
    ("YAMAHA", "YZF-R1"): "/images/motorcycles/2025-Yamaha-YZF1000R1COMP-EU-Tech_Black-360-Degrees-001-03_Mobile.jpg",
    ("YAMAHA", "YZF-R1 WorldSBK"): "/images/motorcycles/Yamaha_Racing_WorldSBK_2025_YZF-R1_Jonathan_Rea_139.jpg",
    ("HONDA", "CBR650R"): "/images/motorcycles/honda-select-model-matte-gunpower-black-metallic-1644556118299.avif",
    ("HONDA", "CBR Sport Concept"): "/images/motorcycles/Honda-Light-Weight-Super-Sports-Concept-scaled.webp",
    ("HONDA", "CBR1000RR-R"): "/images/motorcycles/2026-cbr1000rr-pearl_white-1505x923.avif",
    ("KAWASAKI", "Ninja ZX-10RR"): "/images/motorcycles/2017-Kawasaki-Ninja-ZX-10RR-04-scaled.webp",
    ("KAWASAKI", "Ninja ZX-10R"): "/images/motorcycles/5-111.jpg",
    ("KAWASAKI", "Ninja ZX-10R ABS SE"): "/images/motorcycles/Kawasaki-Ninja-ZX-10R-ABS-01.jpg",
    ("KAWASAKI", "Ninja 650"): "/images/motorcycles/kawasaki-ninja-650-2021-1-0909.png",
    ("KAWASAKI", "Ninja H2R"): "/images/motorcycles/3dc4ccba-aefc-43e1-aa52-d361b442b781.png",
    ("KAWASAKI", "Ninja 400"): "/images/motorcycles/e946a82f-6e78-4531-82f2-72cb6699fc58.png",
    ("KAWASAKI", "Z650"): "/images/motorcycles/6c343928-3abf-4efb-b71e-656b184f05db.png",
    ("KAWASAKI", "Ninja 650 Sport"): "/images/motorcycles/b5da15c5-07b6-400e-b052-7f00eaeaa620.jpg",
    ("DUCATI", "Hypermotard 950"): "/images/motorcycles/a5464a70-17c3-4e09-8877-90fb55f6f38b.webp",
    ("DUCATI", "Streetfighter V4"): "/images/motorcycles/Streetfighter.png",
    ("DUCATI", "Diavel 1260"): "/images/motorcycles/The-Ducati-Diavel-1260-and-xDiavel-gear-patrol-jpg.webp",
    ("DUCATI", "Panigale V4 Bagnaia"): "/images/motorcycles/Panigale-V4-Bagnaia-World-Champion-Model-Preview-1200x800-1.png",
    ("DUCATI", "Supersport 950 S"): "/images/motorcycles/_3_______Supersport-950-S-MY21-Red-01-Model-Preview-1050x650.png",
    ("DUCATI", "Diavel V4"): "/images/motorcycles/Diavel_V4.png",
    ("DUCATI", "Streetfighter V2"): "/images/motorcycles/Model-Menu-MY22-HYM-SP-v06.png",
    ("SUZUKI", "GSX-8R"): "/images/motorcycles/suzuki_gsx8r_kiirolimitededition_sideon.png",
    ("SUZUKI", "GSX-S1000"): "/images/motorcycles/fdb74833-7846-466d-ae8f-695796e5cada.jpg",
    ("SUZUKI", "Hayabusa"): "/images/motorcycles/1107_02.jpg",
    ("SUZUKI", "Hayabusa Blue Storm"): "/images/motorcycles/eyJvdXRwdXRGb3JtYXQiOiJqcGciLCJidWNrZXQiOiJ6YWxhLXByb2R1Y3Rpb24iLCJrZXkiOiJhY2NvdW50LTEwMDBcLzE3NTgyMDc4MDE0NDBfMzE2NzU5MVwvSGF5YWJ1c2EuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsiaGVpZ2h0Ijo2NDAsIndpZHRoIj.jpg",
    ("SUZUKI", "GSX-R150"): "/images/motorcycles/GSX-R150_YSF_Right.webp",
    ("BMW", "R1300 GS"): "/images/motorcycles/6000000012.jpg",
    ("BMW", "R1250RS"): "/images/motorcycles/image28.jpg",
    ("BMW", "M1000R"): "/images/motorcycles/nsc-m1000r-P0N3S-modeloverview_600x360_jpg_asset_1664888615211.avif",
    ("HARLEY-DAVIDSON", "Iron 883"): "/images/motorcycles/harley-davidson-motorcycles.webp",
    ("HARLEY-DAVIDSON", "Street Bob 114"): "/images/motorcycles/Screenshot-1.webp",
    ("HARLEY-DAVIDSON", "Low Rider S"): "/images/motorcycles/images.jpg"
}

PEXELS_FALLBACK_POOL = {
    "Sport": [
        "https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2626661/pexels-photo-2626661.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/612252/pexels-photo-612252.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2085735/pexels-photo-2085735.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2085734/pexels-photo-2085734.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/104842/bmw-motorcycle-motorbike-classic-104842.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    "Naked": [
        "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2611675/pexels-photo-2611675.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2611690/pexels-photo-2611690.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2916027/pexels-photo-2916027.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2085732/pexels-photo-2085732.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2085733/pexels-photo-2085733.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2393816/pexels-photo-2393816.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/159265/motorcycle-race-motorcycle-racing-track-159265.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    "Cruiser": [
        "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/819805/pexels-photo-819805.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/193021/pexels-photo-193021.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2393816/pexels-photo-2393816.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1915149/pexels-photo-1915149.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/104842/bmw-motorcycle-motorbike-classic-104842.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    "Adventure": [
        "https://images.pexels.com/photos/5803191/pexels-photo-5803191.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2798157/pexels-photo-2798157.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/104842/bmw-motorcycle-motorbike-classic-104842.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2611690/pexels-photo-2611690.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2393816/pexels-photo-2393816.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ],
    "Sport Touring": [
        "https://images.pexels.com/photos/612252/pexels-photo-612252.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2916027/pexels-photo-2916027.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/104842/bmw-motorcycle-motorbike-classic-104842.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2393816/pexels-photo-2393816.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1200",
        "https://images.pexels.com/photos/2626661/pexels-photo-2626661.jpeg?auto=compress&cs=tinysrgb&w=1200"
    ]
}

def get_category_fallbacks(category, bike_name, count=5):
    pool = PEXELS_FALLBACK_POOL.get(category, PEXELS_FALLBACK_POOL["Sport"])
    start_idx = abs(hash(bike_name)) % len(pool)
    out = []
    for i in range(count):
        idx = (start_idx + i) % len(pool)
        out.append(pool[idx])
    return out

OFFICIAL_NEW_BIKE_IMAGES = {
    ("YAMAHA", "YZF-R7"): [
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/YZF690/2024-Yamaha-YZF690-EU-Icon_Blue-Studio-001-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/YZF690/2024-Yamaha-YZF690-EU-Icon_Blue-Studio-002-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/YZF690/2024-Yamaha-YZF690-EU-Icon_Blue-Studio-003-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/YZF690/2024-Yamaha-YZF690-EU-Icon_Blue-Action-001-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/YZF690/2024-Yamaha-YZF690-EU-Icon_Blue-Action-002-03.jpg"
    ],
    ("YAMAHA", "MT-09"): [
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT09/2024-Yamaha-MT09-EU-Cyan_Storm-Studio-001-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT09/2024-Yamaha-MT09-EU-Cyan_Storm-Studio-002-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT09/2024-Yamaha-MT09-EU-Cyan_Storm-Studio-003-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT09/2024-Yamaha-MT09-EU-Cyan_Storm-Action-001-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT09/2024-Yamaha-MT09-EU-Cyan_Storm-Action-002-03.jpg"
    ],
    ("YAMAHA", "MT-03"): [
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT03/2024-Yamaha-MT03-EU-Midnight_Black-Studio-001-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT03/2024-Yamaha-MT03-EU-Midnight_Black-Studio-002-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT03/2024-Yamaha-MT03-EU-Midnight_Black-Studio-003-03.jpg",
        "https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT03/2024-Yamaha-MT03-EU-Midnight_Black-Action-001-03.jpg"
    ],
    ("HONDA", "CRF300L"): [
        "https://powersports.honda.com/images/products/2024/CRF300L/gallery/2024_CRF300L_Action_01.jpg",
        "https://powersports.honda.com/images/products/2024/CRF300L/gallery/2024_CRF300L_Studio_01.jpg",
        "https://powersports.honda.com/images/products/2024/CRF300L/gallery/2024_CRF300L_Studio_02.jpg",
        "https://powersports.honda.com/images/products/2024/CRF300L/gallery/2024_CRF300L_Action_02.jpg"
    ],
    ("HONDA", "CB650R"): [
        "https://powersports.honda.com/images/products/2024/CB650R/gallery/2024_CB650R_Studio_01.jpg",
        "https://powersports.honda.com/images/products/2024/CB650R/gallery/2024_CB650R_Studio_02.jpg",
        "https://powersports.honda.com/images/products/2024/CB650R/gallery/2024_CB650R_Action_01.jpg",
        "https://powersports.honda.com/images/products/2024/CB650R/gallery/2024_CB650R_Action_02.jpg"
    ],
    ("HONDA", "Transalp 750"): [
        "https://powersports.honda.com/images/products/2024/Transalp/gallery/2024_Transalp_Action_01.jpg",
        "https://powersports.honda.com/images/products/2024/Transalp/gallery/2024_Transalp_Studio_01.jpg",
        "https://powersports.honda.com/images/products/2024/Transalp/gallery/2024_Transalp_Studio_02.jpg",
        "https://powersports.honda.com/images/products/2024/Transalp/gallery/2024_Transalp_Action_02.jpg"
    ],
    ("KAWASAKI", "ZX-4RR"): [
        "https://images.kawasaki.com/Products/5863/Nav/US_2024_Ninja_ZX-4RR_KRT_Edition_GN1_right.png",
        "https://images.kawasaki.com/Products/5863/Gallery/US_2024_Ninja_ZX-4RR_KRT_Edition_GN1_action_01.jpg",
        "https://images.kawasaki.com/Products/5863/Gallery/US_2024_Ninja_ZX-4RR_KRT_Edition_GN1_action_02.jpg",
        "https://images.kawasaki.com/Products/5863/Gallery/US_2024_Ninja_ZX-4RR_KRT_Edition_GN1_action_03.jpg"
    ],
    ("KAWASAKI", "Ninja 500"): [
        "https://images.kawasaki.com/Products/5877/Nav/US_2024_Ninja_500_SE_ABS_GY1_right.png",
        "https://images.kawasaki.com/Products/5877/Gallery/US_2024_Ninja_500_SE_ABS_GY1_action_01.jpg",
        "https://images.kawasaki.com/Products/5877/Gallery/US_2024_Ninja_500_SE_ABS_GY1_action_02.jpg",
        "https://images.kawasaki.com/Products/5877/Gallery/US_2024_Ninja_500_SE_ABS_GY1_action_03.jpg"
    ],
    ("DUCATI", "Monster 937"): [
        "https://images.ducati.com/dimg/v1/Monster-937-Aviator-Grey-My22-01-Model-Preview-1050x650.png",
        "https://images.ducati.com/dimg/v1/Monster-937-Aviator-Grey-My22-02-Model-Preview-1050x650.png",
        "https://images.ducati.com/dimg/v1/Monster-937-Aviator-Grey-My22-03-Model-Preview-1050x650.png"
    ],
    ("DUCATI", "DesertX"): [
        "https://images.ducati.com/dimg/v1/DesertX-Star-White-Silk-My23-01-Model-Preview-1050x650.png",
        "https://images.ducati.com/dimg/v1/DesertX-Star-White-Silk-My23-02-Model-Preview-1050x650.png",
        "https://images.ducati.com/dimg/v1/DesertX-Star-White-Silk-My23-03-Model-Preview-1050x650.png"
    ],
    ("SUZUKI", "GSX-8S"): [
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/gsx-8s/gallery/2024-gsx-8s-blue-profile.jpg",
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/gsx-8s/gallery/2024-gsx-8s-blue-action-01.jpg",
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/gsx-8s/gallery/2024-gsx-8s-blue-action-02.jpg"
    ],
    ("SUZUKI", "Katana"): [
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/katana/gallery/2024-katana-silver-profile.jpg",
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/katana/gallery/2024-katana-silver-action-01.jpg",
        "https://suzukicycles.com/-/media/project/cycles/images/products/motorcycles/2024/katana/gallery/2024-katana-silver-action-02.jpg"
    ],
    ("BMW", "S1000RR"): [
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/sport/s1000rr-2023/model-overview/nsc-s1000rr-P0N3H-modeloverview_600x360_jpg_asset.jpg",
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/sport/s1000rr-2023/gallery/nsc-s1000rr-gallery-01.jpg",
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/sport/s1000rr-2023/gallery/nsc-s1000rr-gallery-02.jpg"
    ],
    ("BMW", "F900XR"): [
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/adventure/f900xr/model-overview/nsc-f900xr-P0N9F-modeloverview_600x360_jpg_asset.jpg",
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/adventure/f900xr/gallery/nsc-f900xr-gallery-01.jpg",
        "https://www.bmw-motorrad.com/content/dam/bmwmotorradnsc/market/common/images/models/adventure/f900xr/gallery/nsc-f900xr-gallery-02.jpg"
    ],
    ("HARLEY-DAVIDSON", "Pan America 1250"): [
        "https://www.harley-davidson.com/content/dam/h-d/images/product-images/bikes/motorcycle/2024/2024-pan-america-1250-special/2024-pan-america-1250-special-f16/2024-pan-america-1250-special-f16-motorcycle.jpg",
        "https://www.harley-davidson.com/content/dam/h-d/images/product-images/bikes/motorcycle/2024/2024-pan-america-1250-special/2024-pan-america-1250-special-f16/gallery/2024-pan-america-1250-special-f16-gallery-image-01.jpg"
    ],
    ("TRIUMPH", "Street Triple 765 RS"): [
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/roadsters/street-triple-765/2023/gallery/st765-rs-silver-ice-action-01.jpg",
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/roadsters/street-triple-765/2023/gallery/st765-rs-silver-ice-studio-01.jpg",
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/roadsters/street-triple-765/2023/gallery/st765-rs-silver-ice-studio-02.jpg"
    ],
    ("TRIUMPH", "Tiger 900 Rally Pro"): [
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/adventure/tiger-900/2024/gallery/tiger-900-rally-pro-sandstorm-action-01.jpg",
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/adventure/tiger-900/2024/gallery/tiger-900-rally-pro-sandstorm-studio-01.jpg",
        "https://images.triumphmotorcycles.co.uk/media/images/triumph-motorcycles/motorcycles/adventure/tiger-900/2024/gallery/tiger-900-rally-pro-sandstorm-studio-02.jpg"
    ],
    ("KTM", "1290 Super Duke R"): [
        "https://www.ktm.com/content/dam/ktm/models/super-naked/1290-super-duke-r-evo/2023/ktm-1290-super-duke-r-evo-orange-left.jpg",
        "https://www.ktm.com/content/dam/ktm/models/super-naked/1290-super-duke-r-evo/2023/gallery/ktm-1290-super-duke-r-evo-gallery-01.jpg",
        "https://www.ktm.com/content/dam/ktm/models/super-naked/1290-super-duke-r-evo/2023/gallery/ktm-1290-super-duke-r-evo-gallery-02.jpg"
    ]
}

def main():
    json_motorcycles = []
    total_bikes = len(MOTORCYCLE_CATALOG)
    print(f"Generating motorcycles.json using local images and official manufacturer CDNs for {total_bikes} motorcycles...")
    
    for i, bike in enumerate(MOTORCYCLE_CATALOG):
        brand = bike["brand"]
        model = bike["model"]
        
        # Check if we have a pre-existing correct primary image
        pre_existing = PRE_EXISTING_IMAGES.get((brand, model))
        
        images = []
        if pre_existing:
            print(f"[{i+1}/{total_bikes}] {brand} {model} -> Using pre-existing local image: {pre_existing}")
            images.append(pre_existing)
        else:
            # New model - look up in official mappings
            official_urls = OFFICIAL_NEW_BIKE_IMAGES.get((brand, model), [])
            if official_urls:
                print(f"[{i+1}/{total_bikes}] {brand} {model} -> Using {len(official_urls)} official CDN links")
                images.extend(official_urls)
            else:
                print(f"[!] Warning: No images found for {brand} {model}")
                
        bike_data = bike.copy()
        bike_data["images"] = images
        json_motorcycles.append(bike_data)
        
    # Write JSON output
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_motorcycles, f, ensure_ascii=False, indent=2)
        
    print(f"\n==================================================")
    print(f"Done! Cleaned and generated {len(json_motorcycles)} motorcycles catalog in motorcycles.json!")
    print(f"JSON Data: {JSON_PATH}")
    print(f"==================================================")

if __name__ == "__main__":
    main()

